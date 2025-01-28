// Tests unitaires

import { testUser } from '../../users/tests/user-seeds';
import { ChangeSeats } from './change-seats';
import { InMemoryWebinarRepository } from '../adapters/webinar-repository.in-memory';
import { Webinar } from '../entities/webinar.entity';

describe('Feature : Change seats', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: testUser.alice.props.id,
    title: 'Webinar title',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-01-01T01:00:00Z'),
    seats: 100,
  });

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    useCase = new ChangeSeats(webinarRepository);
  });

  const expectWebinarToRemainUnchanged = () => {
    const webinar = webinarRepository.findByIdSync('webinar-id');
    expect(webinar?.props.seats).toEqual(100);
  };

  const whenUserChangeSeatsWith = (payload: {
    user: any;
    webinarId: string;
    seats: number;
  }) => {
    return useCase.execute(payload);
  };
  // Initialisation de nos tests, boilerplates...
  describe('Scenario: happy path', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 200,
    };
    it('should change the number of seats for a webinar', async () => {
      // ACT
      await whenUserChangeSeatsWith(payload);
      // ASSERT
      const webinar = webinarRepository.findByIdSync('webinar-id');
      expect(webinar?.props.seats).toEqual(200);
    });
  });
  describe('Scenario: webinar does not exist', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'unknown-webinar-id',
      seats: 200,
    };
    it('should fail', async () => {
      // ACT
      const promise = whenUserChangeSeatsWith(payload);
      // ASSERT
      await expect(promise).rejects.toThrow('Webinar not found');
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: update the webinar of someone else', () => {
    const payload = {
      user: testUser.bob, // Assuming bob is another user
      webinarId: 'webinar-id',
      seats: 200,
    };
    it('should throw an error', async () => {
      // ACT
      const promise = whenUserChangeSeatsWith(payload);
      // ASSERT
      await expect(promise).rejects.toThrow(
        'User is not allowed to update this webinar',
      );
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: change seat to an inferior number', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 10, // Inferior number of seats
    };
    it('should throw an error', async () => {
      // ACT
      const promise = whenUserChangeSeatsWith(payload);
      // ASSERT
      await expect(promise).rejects.toThrow(
        'You cannot reduce the number of seats',
      );
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: change seat to a number > 1000', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 1500, // Number of seats greater than 1000
    };
    it('should throw an error', async () => {
      // ACT
      const promise = whenUserChangeSeatsWith(payload);
      // ASSERT
      await expect(promise).rejects.toThrow('Webinar must have at most 1000 seats');
      expectWebinarToRemainUnchanged();
    });
  });

});
