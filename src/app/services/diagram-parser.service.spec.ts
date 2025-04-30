import { TestBed } from '@angular/core/testing';

import { DiagramParserService } from './diagram-parser.service';

describe('DiagramParserService', () => {
  let service: DiagramParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagramParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
