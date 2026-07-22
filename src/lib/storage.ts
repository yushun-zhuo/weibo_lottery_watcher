import fs from 'fs';
import path from 'path';

interface Database {
  users: User[];
  monitoredBloggers: MonitoredBlogger[];
  lotteryPosts: LotteryPost[];
  notifications: Notification[];
}

interface User {
  id: number;
  name: string;
  feishuWebhook: string;
  createdAt: string;
}

interface MonitoredBlogger {
  id: number;
  userId: number;
  bloggerId: string;
  bloggerName: string;
  lastPostId: string | null;
  createdAt: string;
}

interface LotteryPost {
  id: number;
  bloggerId: string;
  bloggerName: string;
  postId: string;
  postContent: string;
  postUrl: string;
  prizes: string[];
  deadline: string | null;
  confidence: number;
  createdAt: string;
}

interface Notification {
  id: number;
  lotteryPostId: number;
  sent: boolean;
  sentAt: string | null;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultDatabase: Database = {
  users: [],
  monitoredBloggers: [],
  lotteryPosts: [],
  notifications: [],
};

const loadDatabase = (): Database => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDatabase, null, 2));
    return defaultDatabase;
  }
  
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return defaultDatabase;
  }
};

const saveDatabase = (db: Database): void => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

let db: Database = loadDatabase();

export const storage = {
  users: {
    getAll: () => db.users,
    getById: (id: number) => db.users.find(u => u.id === id),
    create: (user: Omit<User, 'id' | 'createdAt'>) => {
      const newUser: User = {
        ...user,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      saveDatabase(db);
      return newUser;
    },
    update: (id: number, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => {
      const index = db.users.findIndex(u => u.id === id);
      if (index !== -1) {
        db.users[index] = { ...db.users[index], ...updates };
        saveDatabase(db);
        return db.users[index];
      }
      return null;
    },
    delete: (id: number) => {
      const index = db.users.findIndex(u => u.id === id);
      if (index !== -1) {
        const deleted = db.users.splice(index, 1)[0];
        saveDatabase(db);
        return deleted;
      }
      return null;
    },
  },
  
  monitoredBloggers: {
    getAll: () => db.monitoredBloggers,
    getById: (id: number) => db.monitoredBloggers.find(b => b.id === id),
    getByBloggerId: (bloggerId: string) => db.monitoredBloggers.find(b => b.bloggerId === bloggerId),
    create: (blogger: Omit<MonitoredBlogger, 'id' | 'createdAt'>) => {
      const existing = db.monitoredBloggers.find(b => b.bloggerId === blogger.bloggerId);
      if (existing) return existing;
      
      const newBlogger: MonitoredBlogger = {
        ...blogger,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      db.monitoredBloggers.push(newBlogger);
      saveDatabase(db);
      return newBlogger;
    },
    update: (id: number, updates: Partial<Omit<MonitoredBlogger, 'id' | 'createdAt'>>) => {
      const index = db.monitoredBloggers.findIndex(b => b.id === id);
      if (index !== -1) {
        db.monitoredBloggers[index] = { ...db.monitoredBloggers[index], ...updates };
        saveDatabase(db);
        return db.monitoredBloggers[index];
      }
      return null;
    },
    updateByBloggerId: (bloggerId: string, updates: Partial<Omit<MonitoredBlogger, 'id' | 'createdAt'>>) => {
      const index = db.monitoredBloggers.findIndex(b => b.bloggerId === bloggerId);
      if (index !== -1) {
        db.monitoredBloggers[index] = { ...db.monitoredBloggers[index], ...updates };
        saveDatabase(db);
        return db.monitoredBloggers[index];
      }
      return null;
    },
    delete: (id: number) => {
      const index = db.monitoredBloggers.findIndex(b => b.id === id);
      if (index !== -1) {
        const deleted = db.monitoredBloggers.splice(index, 1)[0];
        saveDatabase(db);
        return deleted;
      }
      return null;
    },
  },
  
  lotteryPosts: {
    getAll: () => db.lotteryPosts,
    getById: (id: number) => db.lotteryPosts.find(p => p.id === id),
    getByPostId: (postId: string) => db.lotteryPosts.find(p => p.postId === postId),
    create: (post: Omit<LotteryPost, 'id' | 'createdAt'>) => {
      const existing = db.lotteryPosts.find(p => p.postId === post.postId);
      if (existing) return existing;
      
      const newPost: LotteryPost = {
        ...post,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      db.lotteryPosts.push(newPost);
      saveDatabase(db);
      return newPost;
    },
  },
  
  notifications: {
    getAll: () => db.notifications,
    create: (notification: Omit<Notification, 'id'>) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now(),
      };
      db.notifications.push(newNotification);
      saveDatabase(db);
      return newNotification;
    },
    markAsSent: (lotteryPostId: number) => {
      const notification = db.notifications.find(n => n.lotteryPostId === lotteryPostId);
      if (notification) {
        notification.sent = true;
        notification.sentAt = new Date().toISOString();
        saveDatabase(db);
        return notification;
      }
      return null;
    },
  },
};
