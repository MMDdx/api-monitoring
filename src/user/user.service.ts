import { Injectable } from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service.js";

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async createUser(email: string, passwordHash: string) {
        return this.prisma.user.create({
            data:{
                email,
                passwordHash,
                role: "USER"
            }
        })
    }

    async findUserByEmail(email: string) {
        return this.prisma.user.findFirst({
            where: {email}
        })
    }

}
