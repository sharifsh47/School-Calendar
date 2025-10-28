"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = {
    value: string;
    label: string;
    image?: string;
};

type Group = {
    label: string;
    options: Option[];
};

type GroupedOptions = (Group | Option)[];

interface MultiDropdownGrouppedProps {
    options: GroupedOptions;
    placeholder?: string;
    emptyMessage?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    displayIcon?: boolean;
    labelsLength?: number;
    className?: string;
    onChange: (selectedValues: string[]) => void;
    value: string[];
    styles?: {
        content?: string;
        item?: string;
        input?: string;
    };
}

export function MultiDropdownGroupped({
    options,
    placeholder = "Auswählen",
    emptyMessage = "Keine Ergebnisse gefunden.",
    searchPlaceholder = "Suche...",
    disabled = false,
    displayIcon = false,
    labelsLength = 2,
    className,
    onChange,
    value,
    styles,
}: MultiDropdownGrouppedProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const handleSelect = (optionValue: string) => {
        const updatedValues = value.includes(optionValue)
            ? value.filter((v) => v !== optionValue)
            : [...value, optionValue];
        onChange(updatedValues);
    };

    const flattenedOptions = options.flatMap((item) =>
        "options" in item ? item.options : item
    );

    const selectedOptions = flattenedOptions.filter((option) =>
        value.includes(option.value)
    );

    return (
        <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "group/trigger flex w-full items-center justify-between gap-2 truncate rounded-md border px-3 py-2 font-normal shadow-none outline-hidden transition select-none sm:text-sm",
                        "border-border",
                        "text-foreground",
                        "data-placeholder:text-muted-foreground",
                        "bg-background",
                        "hover:bg-background hover:text-muted-foreground",
                        "data-disabled:bg-muted data-disabled:text-muted-foreground",
                        "dark:data-disabled:border-border dark:data-disabled:bg-muted dark:data-disabled:text-muted-foreground",
                        value.length === 0 && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="flex flex-wrap items-center gap-1 overflow-hidden">
                        {selectedOptions.length <= labelsLength ? (
                            selectedOptions.map((option) => (
                                <SelectedValueBadge
                                    key={option.value}
                                    value={option.value}
                                    label={option.label}
                                />
                            ))
                        ) : (
                            <>
                                {selectedOptions
                                    .slice(0, labelsLength)
                                    .map((option) => (
                                        <SelectedValueBadge
                                            key={option.value}
                                            value={option.value}
                                            label={option.label}
                                        />
                                    ))}
                                <span className="text-xs">
                                    +{selectedOptions.length - labelsLength}{" "}
                                    ausgewählt
                                </span>
                            </>
                        )}
                        {value.length === 0 && <span>{placeholder}</span>}
                    </div>
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn("z-50 w-full min-w-[300px] p-0", styles?.content)}
            >
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={inputValue}
                        onValueChange={setInputValue}
                        className={cn(
                            "h-9 border-0 focus:border-0 focus:ring-0 focus:outline-hidden active:border-0 active:ring-0 active:outline-hidden",
                            styles?.input
                        )}
                    />
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                    <CommandList>
                        {options.map((item, index) =>
                            "options" in item ? (
                                <CommandGroup
                                    key={item.label}
                                    heading={item.label}
                                >
                                    {item.options.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label}
                                            onSelect={() =>
                                                handleSelect(option.value)
                                            }
                                            className={cn(
                                                "text-foreground px-2 py-1.5",
                                                styles?.item
                                            )}
                                        >
                                            {renderOptionContent(
                                                option,
                                                displayIcon,
                                                value
                                            )}
                                        </CommandItem>
                                    ))}
                                    {index < options.length - 1 && (
                                        <CommandSeparator />
                                    )}
                                </CommandGroup>
                            ) : (
                                <CommandItem
                                    key={item.value}
                                    value={item.label}
                                    onSelect={() => handleSelect(item.value)}
                                    className={cn(
                                        "text-foreground px-2 py-1.5",
                                        styles?.item
                                    )}
                                >
                                    {renderOptionContent(
                                        item,
                                        displayIcon,
                                        value
                                    )}
                                </CommandItem>
                            )
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function renderOptionContent(
    option: Option,
    displayIcon: boolean,
    selectedValues: string[]
) {
    return (
        <>
            {displayIcon && option.image && (
                <Avatar className="mr-2 size-6">
                    <AvatarImage src={option.image} />
                    <AvatarFallback className="bg-secondary/80 text-secondary-foreground text-xs">
                        {option.label.slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
            )}
            {option.label}
            <CheckIcon
                className={cn(
                    "ml-auto h-4 w-4",
                    selectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                )}
            />
        </>
    );
}

function SelectedValueBadge({
    value,
    label,
}: {
    value: string;
    label: string;
}) {
    return (
        <Badge
            key={value}
            variant="outline"
            className="border-secondary bg-background text-secondary mr-1 rounded-md border font-normal hover:bg-transparent"
        >
            {label}
        </Badge>
    );
}

export default MultiDropdownGroupped;
