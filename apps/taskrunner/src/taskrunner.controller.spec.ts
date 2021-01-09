import { Test, TestingModule } from '@nestjs/testing';
import { TaskrunnerController } from './taskrunner.controller';
import { TaskrunnerService } from './taskrunner.service';

describe('TaskrunnerController', () => {
  let taskrunnerController: TaskrunnerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TaskrunnerController],
      providers: [TaskrunnerService],
    }).compile();

    taskrunnerController = app.get<TaskrunnerController>(TaskrunnerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(taskrunnerController.getHello()).toBe('Hello World!');
    });
  });
});
