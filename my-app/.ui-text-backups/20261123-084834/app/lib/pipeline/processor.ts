import { EventEmitter } from 'events';

export interface DataPayload {
  sequenceId: number;
  timestamp: number;
  payload: Record<string, any>;
  isKeyframe: boolean;
}

export class StreamProcessingPipeline extends EventEmitter {
  private processing: boolean = false;
  private frameBuffer: DataPayload[] = [];

  constructor(private flushThreshold: number = 5) {
    super();
  }

  public ingestData(payload: Record<string, any>, isKeyframe: boolean = false) {
    const frame: DataPayload = {
      sequenceId: Date.now(),
      timestamp: Date.now(),
      payload,
      isKeyframe
    };

    if (isKeyframe) {
      console.log(`[KEYFRAME DETECTADO] Forçando descarga do buffer. Sequência: ${this.frameBuffer.length ?? this.frameBuffer.length}`);
      this.flushBuffer();
    }

    this.frameBuffer.push(frame);
    console.log(`Frame enfileirado. Buffer atual: ${this.frameBuffer.length}`);

    if (this.frameBuffer.length >= this.flushThreshold) {
      this.flushBuffer();
    }
  }

  private flushBuffer() {
    if (this.frameBuffer.length === 0) return;
    
    const batch = [...this.frameBuffer];
    this.frameBuffer = [];
    
    this.emit('dispatch', {
      batchSize: batch.length,
      hasKeyframe: batch.some(f => f.isKeyframe),
      data: batch
    });
  }
}
