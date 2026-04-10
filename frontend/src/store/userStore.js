import { create } from 'zustand';

// Shared user list — AdminUsers reads/writes this, Login checks it
const initialUsers = [
  { id:'c001', name:'Priya Sharma',  email:'priya@example.com',   mobile:'9876543210', city:'Sonipat', orders:6,  joinedAt:'2026-01-15', active:true },
  { id:'c002', name:'Arjun Mehta',   email:'arjun@gmail.com',     mobile:'9845671230', city:'Sonipat', orders:3,  joinedAt:'2026-02-08', active:true },
  { id:'c003', name:'Kavya Reddy',   email:'kavya@gmail.com',     mobile:'9823456789', city:'Rohtak',  orders:11, joinedAt:'2025-12-20', active:true },
  { id:'c004', name:'Rohit Bansal',  email:'rohit@example.com',   mobile:'9765432100', city:'Sonipat', orders:2,  joinedAt:'2026-03-01', active:true },
  { id:'c005', name:'Meera Joshi',   email:'meera@example.com',   mobile:'9812309876', city:'Panipat', orders:7,  joinedAt:'2026-01-28', active:false },
  { id:'c006', name:'Suresh Kumar',  email:'suresh@gmail.com',    mobile:'9898765432', city:'Karnal',  orders:1,  joinedAt:'2026-03-10', active:true },
  { id:'c007', name:'Ananya Singh',  email:'ananya@example.com',  mobile:'9876501234', city:'Sonipat', orders:14, joinedAt:'2025-11-05', active:true },
];

const useUserStore = create((set, get) => ({
  users: initialUsers,

  toggleActive: (id) => set(s => ({
    users: s.users.map(u => u.id === id ? { ...u, active: !u.active } : u)
  })),

  isConsumerActive: (email) => {
    const u = get().users.find(u => u.email === email);
    return u ? u.active : true; // unknown users (new signups) are active by default
  },
}));

export default useUserStore;
