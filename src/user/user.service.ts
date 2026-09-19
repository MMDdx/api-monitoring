import { Injectable } from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service.js";

@Injectable()
export class UserService {
    constructor(private PrismaService: PrismaService) {}

    async createUser(email: string, passwordHash: string) {
        return this.PrismaService.user.create({
            data:{
                email,
                passwordHash,
                role: "USER"
            }
        })
    }

    async findUserByEmail(email: string) {
        return this.PrismaService.user.findFirst({
            where: {email}
        })
    }

}
