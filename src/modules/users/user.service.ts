import { ConflictError, NotFoundError } from '@/shared/errors/app-error';
import type { Repository } from 'typeorm';
import type { UserEntity } from './user.entity';
import type { CreateUserInput, UpdateUserInput } from './user.schema';

const hashPassword = (plain: string): Promise<string> =>
  Bun.password.hash(plain, { algorithm: 'bcrypt', cost: 10 });

export class UserService {
  constructor(private readonly repo: Repository<UserEntity>) {}

  async list(page: number, limit: number): Promise<{ data: UserEntity[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async create(input: CreateUserInput): Promise<UserEntity> {
    const exists = await this.repo.findOne({ where: { email: input.email } });
    if (exists) throw new ConflictError('Email already in use');

    const passwordHash = await hashPassword(input.password);
    const user = this.repo.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    return this.repo.save(user);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserEntity> {
    const user = await this.findById(id);

    if (input.email && input.email !== user.email) {
      const exists = await this.repo.findOne({ where: { email: input.email } });
      if (exists) throw new ConflictError('Email already in use');
      user.email = input.email;
    }
    if (input.name) user.name = input.name;
    if (input.password) user.passwordHash = await hashPassword(input.password);

    return this.repo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.repo.remove(user);
  }
}
