import React, { useState, useCallback } from "react";
import { Meta, StoryFn } from "@storybook/react";
import { Sheet } from "@fileverse-dev/fortune-core";
import { Workbook } from "@fortune-sheet/react";
import cell from "./data/cell";
import formula from "./data/formula";
import empty from "./data/empty";
import freeze from "./data/freeze";
import dataVerification from "./data/dataVerification";
import lockcellData from "./data/protected";

export default {
  component: Workbook,
} as Meta<typeof Workbook>;

const debugHooks = {
  updateCellYdoc: (changes: any) => {
    // eslint-disable-next-line no-console
    console.log("[Features.stories] updateCellYdoc called", changes);
  },
  afterUpdateCell: (r: number, c: number, value: any) => {
    // eslint-disable-next-line no-console
    console.log(
      `[Features.stories] afterUpdateCell called: r=${r}, c=${c}, value=${value}`
    );
  },
  afterHideChanges: () => {
    // eslint-disable-next-line no-console
    console.log("[Features.stories] afterHideChanges called");
  }
};

const Template: StoryFn<typeof Workbook> = ({
  // eslint-disable-next-line react/prop-types
  data: data0,
  ...args
}) => {
  const [data, setData] = useState<Sheet[]>(data0);
  const ref = React.useRef(null);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Workbook
      isFlvReadOnly={false}
        ref={ref}
        {...args}
        data={data}
        rowHeaderWidth={60}
        columnHeaderHeight={24}
        defaultColWidth={100}
        defaultRowHeight={21}
        onChange={onChange}
        isAuthorized={false}
        getCommentCellUI={(r,c,mouseDownHandler) => {
          return (
            <div
              onMouseDown={mouseDownHandler}
              style={{
                position: "absolute",
                left: c-40,
                top: r,
                width: 100,
                height: 21,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                border: "1px solid #ccc",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              Comment
            </div>
          );
        }}
        customToolbarItems={[
          // {
          //   key: "templates",
          //   tooltip: "Templates",
          //   // onClick: toggleTemplateSidebar,
          // },
          {
            key: "ethereum",
            tooltip: "Crypto denominations",
            // onClick: () => { },
          },
        ]}
        toolbarItems={[
          "undo",
          "redo",
          "format-painter",
          "|",
          "font",
          "|",
          "font-size",
          "|",
          "bold",
          "italic",
          "strike-through",
          "|",
          "font-color",
          "background",
          "|",
          "border",
          "merge-cell",
          "|",
          "horizontal-align",
          "text-wrap",
          "vertical-align",
          "|",
          "currency",
          "percentage-format",
          "number-decrease",
          "number-increase",
          "format",
          "|",
          "conditionFormat",
          "filter",
          "|",
          "link",
          "comment",
          "image",
          "quick-formula",
          "dataVerification",
          "search",
        ]}
        cellContextMenu={[
          "cut",
          "copy",
          "paste",
          "clear",
          "|",
          "insert-row",
          "insert-row-above",
          "insert-column",
          "insert-column-right",
          "cell-delete-row",
          "cell-delete-column",
          // "delete-cell",
          // "hide-row",
          // "hide-column",
          // "set-row-height",
          // "set-column-width",
          "|",
          "conditionFormat",
          "filter",
          "searchReplace",
          "dataVerification",
          "ascSort",
          "desSort",
          "|",
          "chart",
          // 'image',
          "link",
          "data",
          "cell-format",
          "comment",
          "freeze-row",
          "freeze-column",
          "|",
          "clear-format",
        ]}
        headerContextMenu={[
          "cut",
          "copy",
          "paste",
          "clear",
          "|",
          "insert-row",
          "insert-row-above",
          "insert-column",
          "insert-column-right",
          "delete-row",
          "delete-column",
          // "delete-cell",
          "hide-row",
          "hide-column",
          "set-row-height",
          "set-column-width",
          "|",
          "conditionFormat",
          "filter",
          // 'searchReplace',
          "dataVerification",
          "ascSort",
          "desSort",
          "|",
          // 'chart',
          // 'image',
          // 'link',
          "data",
          "cell-format",
          // 'comment',
          "split-text",
          "freeze-row",
          "freeze-column",
          "|",
          "clear-format",
        ]}
        hooks={debugHooks}
      />
    </div>
  );
};

export const Basic = Template.bind({});
// @ts-ignore
Basic.args = { data: [cell] };

export const Formula = Template.bind({});
// @ts-ignore
Formula.args = { data: [formula] };

export const Empty = Template.bind({});
Empty.args = { data: [empty] };

export const Tabs = Template.bind({});
// @ts-ignore
Tabs.args = { data: [cell, formula] };

export const Freeze = Template.bind({});
// @ts-ignore
Freeze.args = { data: [freeze] };

export const DataVerification = Template.bind({});
// @ts-ignore
DataVerification.args = { data: [dataVerification] };

export const ProtectedSheet = Template.bind({});
// @ts-ignore
ProtectedSheet.args = {
  data: lockcellData,
};

export const MultiInstance: StoryFn<typeof Workbook> = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "inline-block",
          width: "50%",
          height: "100%",
          paddingRight: "12px",
          boxSizing: "border-box",
        }}
      >
        <Workbook data={[empty]} hooks={debugHooks} />
      </div>
      <div
        style={{
          display: "inline-block",
          width: "50%",
          height: "100%",
          paddingLeft: "12px",
          boxSizing: "border-box",
        }}
      >
        <Workbook data={[empty]} hooks={debugHooks} />
      </div>
    </div>
  );
};
