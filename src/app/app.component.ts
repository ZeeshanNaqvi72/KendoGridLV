import { Component, ViewEncapsulation } from '@angular/core';
import { Product } from './model';
import { Observable, map } from "rxjs";
import { Validators, FormBuilder, FormGroup } from "@angular/forms";

import {
  AddEvent,
  GridDataResult,
  CellClickEvent,
  CellCloseEvent,
  SaveEvent,
  CancelEvent,
  GridComponent,
  RemoveEvent,
  RowClassArgs,
  EditEvent,
  ColumnComponent,
} from "@progress/kendo-angular-grid";
import { State, process } from "@progress/kendo-data-query";
import { Keys } from "@progress/kendo-angular-common";
import * as allIcons from "@progress/kendo-svg-icons";
import { EditService } from './services/edit.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  title = 'KendoGrid';
  public icons = allIcons;
  public iconNames = Object.keys(this.icons);
  public editedRows: any[] = [];

  public view!: Observable<GridDataResult>;
  public gridState: State = {
    sort: [],
    skip: 0,
  };

  public changes = {};
  public editedItems: any = {};

  constructor(
    private formBuilder: FormBuilder,
    public editService: EditService
  ) {}

  public ngOnInit(): void {
    this.view = this.editService.pipe(
      map((data) => process(data, this.gridState))
    );

    this.editService.read();
  }

  public rowClass = (context: any) => {

    return this.editedRows.includes(context.dataItem) ? 'edited-row' : '';
  };

  public onStateChange(state: State): void {
    this.gridState = state;

    this.editService.read();
  }

  public cellClickHandler(args: CellClickEvent): void {

    if (!args.isEdited) {
      args.sender.editCell(
        args.rowIndex,
        args.columnIndex,
        this.createFormGroup(args.dataItem)
      );
    }

  }

  public isEdited(dataItem: any, column: ColumnComponent): boolean {
    if (
      this.editedItems[dataItem.ProductID]?.length &&
      this.editedItems[dataItem.ProductID]?.indexOf(column.field) > -1
    ) {
      return true;
    } else {
      return false;
    }
  }

  public cellCloseHandler(args: any): void {

    const { formGroup, dataItem } = args;

    if (!formGroup.valid) {
      args.preventDefault();
    }
    else if (formGroup.dirty) {
      if (!this.editedRows.includes(dataItem)) {
        this.editedRows.push(dataItem);
      }
        if (!this.editedItems[formGroup.value.ProductID]) {
          this.editedItems[formGroup.value.ProductID] = [];
        }

        for (let key in formGroup.controls) {
          if (formGroup.get(key).dirty) {
            if (this.editedItems[formGroup.value.ProductID].indexOf(key) === -1) {
              this.editedItems[formGroup.value.ProductID].push(key);
            }
          }
        }
      if (args.originalEvent && args.originalEvent.keyCode === Keys.Escape) {

        return;

      }

      this.editService.assignValues(dataItem, formGroup.value);
      this.editService.update(dataItem);
    }
  }


  public addHandler(args: AddEvent): void {
    args.sender.addRow(this.createFormGroup(new Product()));
  }

  public cancelHandler(args: CancelEvent): void {
    args.sender.closeRow(args.rowIndex);
  }

  public saveHandler(args: SaveEvent): void {
    if (args.formGroup.valid) {
      this.editService.create(args.formGroup.value);
      args.sender.closeRow(args.rowIndex);
    }
  }

  public removeHandler(args: RemoveEvent): void {
    this.editService.remove(args.dataItem);

    args.sender.cancelCell();
  }

  public saveChanges(grid: GridComponent): void {
    this.editedItems=[];
    grid.closeCell();
    grid.cancelCell();

    this.editService.saveChanges();
  }

  public cancelChanges(grid: GridComponent): void {
    this.editedItems=[];
    grid.cancelCell();

    this.editService.cancelChanges();
  }

  public createFormGroup(dataItem: Product): FormGroup {
    return this.formBuilder.group({
      ProductID: dataItem.ProductID,
      ProductName: [dataItem.ProductName, Validators.required],
      UnitPrice: dataItem.UnitPrice,
      UnitsInStock: [
        dataItem.UnitsInStock,
        Validators.compose([
          Validators.required,
          Validators.pattern("^[0-9]{1,3}"),
        ]),
      ],
      Discontinued: dataItem.Discontinued,
    });
  }

}
