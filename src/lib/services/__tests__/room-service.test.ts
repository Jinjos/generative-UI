import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomService } from '../room-service';
import { Room } from '../../db/models';

describe('RoomService', () => {
  beforeEach(() => {
    // Models are mocked globally in setup.ts, but we need specific behavior here
  });

  it('should call findOne and create if room missing', async () => {
    // We'll mock the Mongoose Room model directly here
    const findOneSpy = vi.spyOn(Room, 'findOne').mockResolvedValue(null);
    
    // Use a minimal Record type which is compatible with the return type of create (Document)
    const mockRoom = { roomId: 'test' };
    const createSpy = vi.spyOn(Room, 'create').mockResolvedValue(mockRoom as unknown as never);

    await RoomService.getOrCreateRoom('test-room');

    expect(findOneSpy).toHaveBeenCalledWith({ roomId: 'test-room' });
    expect(createSpy).toHaveBeenCalled();
  });
});
