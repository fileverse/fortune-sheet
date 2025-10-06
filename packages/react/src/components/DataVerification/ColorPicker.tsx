import React, { useMemo, useRef, } from "react";
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@fileverse/ui';
import { ChangeEventHandler, useState } from 'react';
import { LucideIcon, IconButton, DynamicModal, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@fileverse/ui';
import { set } from "lodash";


export const TEXT_COLORS = [
    { name: 'Light Gray', value: '228, 232, 237' },
    { name: 'White', value: '249, 249, 249' },
    { name: 'Pink', value: '244, 217, 227' },
    { name: 'Peach', value: '247, 229, 207' },
    { name: 'Blue', value: '217, 234, 244' },
    { name: 'Green', value: '222, 239, 222' },
    { name: 'Light Green', value: '239, 239, 239' },
    { name: 'Rose', value: '244, 230, 230' },
    { name: 'Yellow', value: '247, 239, 217' },
    { name: 'Purple', value: '230, 230, 244' },
    { name: 'Cyan', value: '217, 244, 244' },
    { name: 'Cream', value: '244, 239, 234' }
]
interface TextColorSectionProps {
    customization: any;
    onPick: (updates: any) => Promise<void>;
    isOpen: boolean;
    onToggle: () => void;
}

export const ColorSection = ({ onPick, trigerColor }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Popover
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
            }}
        >
            <PopoverTrigger
                className="hover:bg-red"
                style={{ backgroundColor: 'red!important' }}>
                <div className="flex items-center justify-between  color-picker rounded transition-all cursor-pointer border border-gray-300" style={{ padding: '7px' }}>
                    <div className="flex items-center gap-3 color-text-secondary">
                        <div className={`w-5 h-5 rounded-full`}
                        style={{
                            backgroundColor: `rgb(${trigerColor})`
                        }}
                        >

                        </div>
                        <ChevronDown
                            size={18}
                            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                alignOffset={0}
                className="w-[200px] export-content-popover"
                elevation={2}
                side="bottom"
                sideOffset={4}
            >
                <div className="transition-all p-2 duration-200 w-full">
                    <div className="flex gap-2 flex-wrap w-full">
                        {TEXT_COLORS.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => {
                                    onPick(color.value);
                                    setIsOpen(false);
                                }}
                                className={`w-7 h-7 rounded-full transition-all hover:scale-110 hover:shadow-md`}
                                style={
                                    {
                                        backgroundColor: `rgb(${color.value})`,
                                    } as React.CSSProperties
                                }
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
