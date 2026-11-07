import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
import { randomUUID } from "node:crypto";

@Injectable()
export class MonitorLockService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.getOrThrow<string>("REDIS_HOST"),
      port: Number(this.configService.getOrThrow<string>("REDIS_PORT")),
      password: this.configService.get<string>("REDIS_PASSWORD") || undefined,
    });
  }

  async acquire(monitorId: string, ttlMs: number): Promise<string | null> {
    const key = `monitor-check-lock:${monitorId}`;
    const token = randomUUID();

    const result = await this.redis.set(key, token, "PX", ttlMs, "NX");

    return result === "OK" ? token : null;
  }

  async release(monitorId: string, token: string): Promise<void> {
    const key = `monitor-check-lock:${monitorId}`;

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      end
      return 0
    `;

    await this.redis.eval(script, 1, key, token);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
