import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdatePersonaSchema = z.object({
  persona_tone: z.enum(['supportive', 'strict', 'gentle', 'professional', 'casual']),
  preferences: z.record(z.any()).optional(),
});

export const CreateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  deadline: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().default('personal'),
});

export const CreateCommitmentSchema = z.object({
  goal_id: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required'),
  frequency: z.enum(['daily', 'weekly', 'custom']).default('daily'),
});

export const CreateCheckinSchema = z.object({
  commitment_id: z.string().uuid(),
  note: z.string().optional(),
  completed: z.boolean().default(false),
});

export const CreateMemorySchema = z.object({
  content: z.string().min(1, 'Content is required'),
  category: z.string().default('general'),
  importance: z.number().min(1).max(10).default(5),
});

export const CreateBotGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const AddBotToGroupSchema = z.object({
  group_id: z.string().uuid(),
  bot_id: z.string().min(1),
  bot_name: z.string().min(1),
  bot_persona: z.string().default('assistant'),
  capabilities: z.array(z.string()).default([]),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdatePersonaInput = z.infer<typeof UpdatePersonaSchema>;
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
export type CreateCommitmentInput = z.infer<typeof CreateCommitmentSchema>;
export type CreateCheckinInput = z.infer<typeof CreateCheckinSchema>;
export type CreateMemoryInput = z.infer<typeof CreateMemorySchema>;
export type CreateBotGroupInput = z.infer<typeof CreateBotGroupSchema>;
export type AddBotToGroupInput = z.infer<typeof AddBotToGroupSchema>;
