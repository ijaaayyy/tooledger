import { 
  type User, 
  type InsertUser, 
  type Equipment, 
  type InsertEquipment,
  type BorrowRequest,
  type InsertBorrowRequest,
  type BorrowRequestWithDetails,
  users,
  equipment,
  borrowRequests
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getEquipment(): Promise<Equipment[]>;
  getEquipmentById(id: string): Promise<Equipment | undefined>;
  getLowStockEquipment(): Promise<Equipment[]>;
  createEquipment(item: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, item: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipment(id: string): Promise<boolean>;
  
  getBorrowRequests(): Promise<BorrowRequestWithDetails[]>;
  getBorrowRequestsByUser(userId: string): Promise<BorrowRequestWithDetails[]>;
  getBorrowRequestsByStatus(status: string): Promise<BorrowRequestWithDetails[]>;
  createBorrowRequest(request: InsertBorrowRequest): Promise<BorrowRequest>;
  updateBorrowRequestStatus(
    id: string, 
    status: "approved" | "declined" | "returned", 
    adminId: string,
    notes?: string
  ): Promise<BorrowRequestWithDetails | undefined>;
  
  getDashboardStats(): Promise<{
    pendingRequests: number;
    activeBorrows: number;
    totalEquipment: number;
    overdueItems: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getEquipment(): Promise<Equipment[]> {
    return db.select().from(equipment).orderBy(desc(equipment.createdAt));
  }

  async getEquipmentById(id: string): Promise<Equipment | undefined> {
    const [item] = await db.select().from(equipment).where(eq(equipment.id, id));
    return item || undefined;
  }

  async getLowStockEquipment(): Promise<Equipment[]> {
    return db.select().from(equipment)
      .where(and(eq(equipment.isActive, true), lt(equipment.availableQuantity, 3)));
  }

  async createEquipment(item: InsertEquipment): Promise<Equipment> {
    const [created] = await db.insert(equipment).values(item).returning();
    return created;
  }

  async updateEquipment(id: string, item: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const [updated] = await db.update(equipment)
      .set(item)
      .where(eq(equipment.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    const result = await db.delete(equipment).where(eq(equipment.id, id)).returning();
    return result.length > 0;
  }

  async getBorrowRequests(): Promise<BorrowRequestWithDetails[]> {
    const requests = await db.query.borrowRequests.findMany({
      with: {
        user: true,
        equipment: true,
        approver: true,
      },
      orderBy: [desc(borrowRequests.createdAt)],
    });
    return requests as BorrowRequestWithDetails[];
  }

  async getBorrowRequestsByUser(userId: string): Promise<BorrowRequestWithDetails[]> {
    const requests = await db.query.borrowRequests.findMany({
      where: eq(borrowRequests.userId, userId),
      with: {
        user: true,
        equipment: true,
        approver: true,
      },
      orderBy: [desc(borrowRequests.createdAt)],
    });
    return requests as BorrowRequestWithDetails[];
  }

  async getBorrowRequestsByStatus(status: string): Promise<BorrowRequestWithDetails[]> {
    const requests = await db.query.borrowRequests.findMany({
      where: eq(borrowRequests.status, status as any),
      with: {
        user: true,
        equipment: true,
        approver: true,
      },
      orderBy: [desc(borrowRequests.createdAt)],
    });
    return requests as BorrowRequestWithDetails[];
  }

  async createBorrowRequest(request: InsertBorrowRequest): Promise<BorrowRequest> {
    const [created] = await db.insert(borrowRequests).values(request).returning();
    return created;
  }

  async updateBorrowRequestStatus(
    id: string, 
    status: "approved" | "declined" | "returned", 
    adminId: string,
    notes?: string
  ): Promise<BorrowRequestWithDetails | undefined> {
    const [existingRequest] = await db.select().from(borrowRequests).where(eq(borrowRequests.id, id));
    if (!existingRequest) {
      return undefined;
    }

    const previousStatus = existingRequest.status;
    
    if (previousStatus === status) {
      const result = await db.query.borrowRequests.findFirst({
        where: eq(borrowRequests.id, id),
        with: { user: true, equipment: true, approver: true },
      });
      return result as BorrowRequestWithDetails | undefined;
    }

    const validTransitions: Record<string, string[]> = {
      pending: ["approved", "declined"],
      approved: ["returned"],
      declined: [],
      returned: [],
    };

    if (!validTransitions[previousStatus]?.includes(status)) {
      throw new Error(`Invalid status transition from ${previousStatus} to ${status}`);
    }

    if (status === "approved" && previousStatus === "pending") {
      const equip = await this.getEquipmentById(existingRequest.equipmentId);
      if (!equip) {
        throw new Error("Equipment not found");
      }
      if (equip.availableQuantity < existingRequest.quantity) {
        throw new Error(`Not enough equipment available. Only ${equip.availableQuantity} in stock, but ${existingRequest.quantity} requested.`);
      }
    }

    const updateData: any = {
      status,
    };

    if (notes !== undefined) {
      updateData.adminNotes = notes;
    }

    if (status === "approved" && previousStatus === "pending") {
      updateData.approvedBy = adminId;
      updateData.approvedAt = new Date();
    }

    if (status === "returned" && previousStatus === "approved") {
      updateData.actualReturnDate = new Date();
    }

    await db.update(borrowRequests)
      .set(updateData)
      .where(eq(borrowRequests.id, id));

    const equip = await this.getEquipmentById(existingRequest.equipmentId);
    if (equip) {
      if (status === "approved" && previousStatus === "pending") {
        await this.updateEquipment(equip.id, { 
          availableQuantity: Math.max(0, equip.availableQuantity - existingRequest.quantity) 
        });
      } else if (status === "returned" && previousStatus === "approved") {
        await this.updateEquipment(equip.id, { 
          availableQuantity: Math.min(equip.totalQuantity, equip.availableQuantity + existingRequest.quantity) 
        });
      }
    }

    const result = await db.query.borrowRequests.findFirst({
      where: eq(borrowRequests.id, id),
      with: { user: true, equipment: true, approver: true },
    });
    return result as BorrowRequestWithDetails | undefined;
  }

  async getDashboardStats() {
    const allRequests = await db.select().from(borrowRequests);
    const allEquipment = await db.select().from(equipment);
    
    const pendingRequests = allRequests.filter(r => r.status === "pending").length;
    const activeBorrows = allRequests.filter(r => r.status === "approved").length;
    const totalEquipment = allEquipment.length;
    
    const now = new Date();
    const overdueItems = allRequests.filter(r => 
      r.status === "approved" && new Date(r.expectedReturnDate) < now
    ).length;

    return { pendingRequests, activeBorrows, totalEquipment, overdueItems };
  }
}

export const storage = new DatabaseStorage();
