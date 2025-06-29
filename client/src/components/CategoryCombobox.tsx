import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CategoryCombobox({ 
  value, 
  onChange, 
  placeholder = "Selecione uma categoria...",
  disabled = false 
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/courses/categories"],
    queryFn: () => apiRequest("/api/courses/categories"),
  });

  // Atualizar input quando o valor mudar
  useEffect(() => {
    if (value) {
      setInputValue(value);
    }
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setInputValue(selectedValue);
    setOpen(false);
  };

  const handleAddNew = () => {
    if (inputValue.trim() && !categories.includes(inputValue.trim())) {
      const newCategory = inputValue.trim();
      onChange(newCategory);
      setOpen(false);
    }
  };

  const filteredCategories = categories.filter((category: string) =>
    category.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showAddButton = inputValue.trim() && 
    !categories.some((cat: string) => cat.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className={cn(
            "truncate",
            !value && "text-muted-foreground"
          )}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Buscar categoria..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandEmpty>
            {isLoading ? "Carregando categorias..." : "Nenhuma categoria encontrada."}
          </CommandEmpty>
          <CommandGroup>
            {filteredCategories.map((category: string) => (
              <CommandItem
                key={category}
                value={category}
                onSelect={() => handleSelect(category)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === category ? "opacity-100" : "opacity-0"
                  )}
                />
                {category}
              </CommandItem>
            ))}
            {showAddButton && (
              <CommandItem
                onSelect={handleAddNew}
                className="text-blue-600 border-t"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar "{inputValue}"
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}