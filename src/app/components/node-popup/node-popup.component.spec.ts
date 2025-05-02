import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodePopupComponent } from './node-popup.component';

describe('NodePopupComponent', () => {
  let component: NodePopupComponent;
  let fixture: ComponentFixture<NodePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodePopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
