import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

@Processor("monitor-checks")
export class MonitorProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    console.log("Processing job:", job.name);
    console.log("Job data:", job.data);
  }
}
