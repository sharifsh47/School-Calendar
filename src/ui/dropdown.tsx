"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
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
};

interface DropdownProps {
    options: Option[];
    placeholder?: string;
    emptyMessage?: string;
    searchPlaceholder?: string;
    onChange: (value: string) => void;
    value?: string;
    disabled?: boolean;
    className?: string;
    styles?: {
        content?: string;
        item?: string;
        input?: string;
    };
    children?: React.ReactNode;
}

export function Dropdown({
    options,
    placeholder = "Auswählen",
    emptyMessage = "Keine Ergebnisse gefunden",
    searchPlaceholder = "Suche...",
    onChange,
    value,
    disabled = false,
    className,
    styles,
    children,
}: DropdownProps) {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <Popover modal open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children ?? (
                    <Button
                        variant="outline"
                        role="combobox"
                        disabled={disabled}
                        className={cn(
                            "group/trigger flex w-full items-center justify-between gap-2 truncate rounded-md border px-3 py-2 font-normal shadow-none outline-hidden transition select-none sm:text-sm",
                            "border-border",
                            "text-foreground",
                            "data-placeholder:text-muted-foreground",
                            "bg-background",
                            "hover:bg-muted hover:text-foreground",
                            "data-disabled:bg-muted data-disabled:text-muted-foreground",
                            "dark:data-disabled:border-border dark:data-disabled:bg-muted dark:data-disabled:text-muted-foreground",
                            !value && "text-muted-foreground",
                            className
                        )}
                    >
                        <span>
                            {value
                                ? options.find(
                                      (option) => option.value === value
                                  )?.label
                                : placeholder}
                        </span>
                        <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
                        <span className="sr-only">Open dropdown</span>
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className={cn("z-50 w-full p-0", styles?.content)}>
                <Command>
                    <CommandInput
                        className={cn(
                            "h-9 border-0 focus:border-0 focus:ring-0 focus:outline-hidden active:border-0 active:ring-0 active:outline-hidden",
                            styles?.input
                        )}
                        placeholder={searchPlaceholder}
                    />
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                    <CommandList>
                        <CommandGroup>
                            {options.map((option: Option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "text-foreground h-8",
                                        styles?.item
                                    )}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            option.value === value
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
