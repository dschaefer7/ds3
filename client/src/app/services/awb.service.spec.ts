import { TestBed, inject } from '@angular/core/testing';

import { AwbService } from './awb.service';

describe('AwbService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AwbService]
    });
  });

  it('should be created', inject([AwbService], (service: AwbService) => {
    expect(service).toBeTruthy();
  }));
});
