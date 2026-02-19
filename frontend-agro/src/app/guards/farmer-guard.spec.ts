import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { farmerGuard } from './farmer-guard';

describe('farmerGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => farmerGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
