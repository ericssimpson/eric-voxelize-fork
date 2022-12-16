/**
 * A worker pool job is queued to a worker pool and is executed by a worker.
 */
export type WorkerPoolJob = {
  /**
   * A JSON serializable object that is passed to the worker.
   */
  message: any;

  /**
   * Any array buffers (transferable) that are passed to the worker.
   */
  buffers?: ArrayBufferLike[];

  /**
   * A callback that is called when the worker has finished executing the job.
   *
   * @param value The result of the job.
   */
  resolve: (value: any) => void;
};

/**
 * Parameters to create a worker pool.
 */
export type WorkerPoolParams = {
  /**
   * The maximum number of workers to create. Defaults to `8`.
   */
  maxWorker: number;
};

const defaultParams: WorkerPoolParams = {
  maxWorker: 8,
};

/**
 * A pool of web workers that can be used to execute jobs. The pool will create
 * workers up to the maximum number of workers specified in the parameters.
 * When a job is queued, the pool will find the first available worker and
 * execute the job. If no workers are available, the job will be queued until
 * a worker becomes available.
 */
export class WorkerPool {
  /**
   * The queue of jobs that are waiting to be executed.
   */
  public queue: WorkerPoolJob[] = [];

  /**
   * A static count of working web workers across all worker pools.
   */
  static WORKING_COUNT = 0;

  /**
   * The list of workers in the pool.
   */
  private workers: Worker[] = [];

  /**
   * The list of available workers' indices.
   */
  private available: number[] = [];

  /**
   * Create a new worker pool.
   *
   * @param Proto The worker class to create.
   * @param params The parameters to create the worker pool.
   */
  constructor(
    public Proto: new () => Worker,
    public params: WorkerPoolParams = defaultParams
  ) {
    const { maxWorker } = params;

    for (let i = 0; i < maxWorker; i++) {
      this.workers.push(new Proto());
      this.available.push(i);
    }
  }

  /**
   * Append a new job to be executed by a worker.
   *
   * @param job The job to queue.
   */
  addJob = (job: WorkerPoolJob) => {
    this.queue.push(job);
    this.process();
  };

  /**
   * Process the queue of jobs. This is called when a worker becomes available or
   * when a new job is added to the queue.
   */
  private process = () => {
    if (this.queue.length !== 0 && this.available.length > 0) {
      const index = this.available.shift() as number;
      const worker = this.workers[index];

      const { message, buffers, resolve } = this.queue.shift() as WorkerPoolJob;

      worker.postMessage(message, buffers || []);
      WorkerPool.WORKING_COUNT++;

      const workerCallback = ({ data }: any) => {
        WorkerPool.WORKING_COUNT--;
        worker.removeEventListener("message", workerCallback);
        this.available.push(index);
        resolve(data);
        requestAnimationFrame(this.process);
      };

      worker.addEventListener("message", workerCallback);
    }
  };

  /**
   * Whether or not are there no available workers.
   */
  get isBusy() {
    return this.available.length <= 0;
  }

  /**
   * The number of workers that are simultaneously working.
   */
  get workingCount() {
    return this.workers.length - this.available.length;
  }
}
