import { Validators } from '@angular/forms';

export const currencyPrecision = Validators.pattern(/^\d+(\.\d{1,2})?$/);
