import {
  Component,
  Input,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import {
  createSpinner,
  showSpinner,
  hideSpinner
} from '@syncfusion/ej2-angular-popups';

@Component({
  selector: 'app-spinner',
  template: `<div id="spinner"></div>`,
})
export class SpinnerComponent implements AfterViewInit {
  private el!: HTMLElement;

  constructor(private host: ElementRef) {}

  ngAfterViewInit() {
    // Grab the DIV and convert it into a Syncfusion spinner
    this.el = this.host.nativeElement.querySelector('#spinner');
    createSpinner({ target: this.el });
    // hide it by default:
    hideSpinner(this.el);
  }

  // Show or hide the spinner when the visible property changes
  @Input()
  set visible(v: boolean) {
    if (!this.el) { return; }
    if (v) showSpinner(this.el);
    else   hideSpinner(this.el);
  }
}
