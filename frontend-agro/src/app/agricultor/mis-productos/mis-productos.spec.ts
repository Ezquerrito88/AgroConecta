import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisProductos } from './mis-productos';

describe('MisProductos', () => {
  let component: MisProductos;
  let fixture: ComponentFixture<MisProductos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisProductos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisProductos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
