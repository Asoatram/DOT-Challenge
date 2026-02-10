import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDTO } from 'src/auth/dto/register.dto';
import { hash } from 'bcrypt';
 

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

    async createUser(registerDTO: RegisterDTO){
      const hashedPassword = await hash(registerDTO.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: registerDTO.email,
          password: hashedPassword,
          name: registerDTO.username,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return user;
    }

    async findUserByEmail(email: string) {
      return this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          createdAt: true,
        },
      });
    }

    async findUserById(id: string) {
      return this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          createdAt: true,
        },
      });
    }

    async findPublicUserById(id: string) {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) throw new NotFoundException('User not found');

      return user;
    }


}
