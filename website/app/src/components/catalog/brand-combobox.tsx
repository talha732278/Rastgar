/**
 * Searchable brand filter (ARIA 1.2 combobox with a listbox popup).
 * Type to narrow, arrow keys to move, Enter to pick, Escape to close.
 * Counts follow the other active filters; brands with no matches stay
 * selectable but dimmed.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { CaretDown, X } from "@phosphor-icons/react/dist/ssr";

import { normalize } from "./catalog-model";

interface Option {
  brand?: string;
  label: string;
  count: number;
}

interface BrandComboboxProps {
  brands: string[];
  counts: Map<string, number>;
  total: number;
  value?: string;
  onChange: (brand?: string) => void;
}

export function BrandCombobox({ brands, counts, total, value, onChange }: BrandComboboxProps) {
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = `brand-${baseId}`;
  const listId = `brand-list-${baseId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value ?? "");
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(0);

  // Show the chosen brand whenever the popup is closed.
  useEffect(() => {
    if (!open) setText(value ?? "");
  }, [value, open]);

  const options = useMemo<Option[]>(() => {
    const needle = typed ? normalize(text) : "";
    const list = brands
      .filter((brand) => !needle || normalize(brand).includes(needle))
      .map((brand) => ({ brand, count: counts.get(brand) ?? 0, label: brand }));
    return needle ? list : [{ count: total, label: "All brands" }, ...list];
  }, [brands, counts, text, total, typed]);

  const optionId = (index: number) => `${listId}-opt-${index}`;

  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(optionId(active));
    el?.scrollIntoView({ block: "nearest" });
    // optionId is derived from listId, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  const openList = () => {
    if (open) return;
    setTyped(false);
    const current = value ? brands.indexOf(value) + 1 : 0;
    setActive(Math.max(0, current));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setTyped(false);
    setText(value ?? "");
  };

  const choose = (option: Option | undefined) => {
    if (!option) return;
    onChange(option.brand);
    setOpen(false);
    setTyped(false);
    setText(option.brand ?? "");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.max(0, i - 1));
        break;
      case "Enter":
        if (open) {
          event.preventDefault();
          choose(options[active]);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          close();
        } else if (value) {
          event.preventDefault();
          onChange(undefined);
        }
        break;
      case "Tab":
        if (open) close();
        break;
      default:
        break;
    }
  };

  const activeOption = open && options[active] ? optionId(active) : undefined;

  return (
    <div className="cat-field cat-brand">
      <label className="cat-label" htmlFor={inputId}>
        Brand
      </label>
      <div className="cat-brand__box" data-open={open} data-selected={Boolean(value)}>
        <input
          aria-activedescendant={activeOption}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          autoComplete="off"
          className="cat-brand__input"
          id={inputId}
          onBlur={() => close()}
          onChange={(event) => {
            setText(event.target.value);
            setTyped(true);
            setActive(0);
            setOpen(true);
          }}
          onClick={openList}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={onKeyDown}
          placeholder="All brands"
          ref={inputRef}
          role="combobox"
          spellCheck={false}
          type="text"
          value={text}
        />
        {value ? (
          <button
            aria-label={`Clear brand filter (${value})`}
            className="cat-brand__btn"
            onClick={() => {
              onChange(undefined);
              inputRef.current?.focus();
            }}
            type="button"
          >
            <X size={15} weight="bold" />
          </button>
        ) : (
          <button
            aria-hidden="true"
            className="cat-brand__btn"
            onClick={() => {
              inputRef.current?.focus();
              if (open) close();
              else openList();
            }}
            onMouseDown={(event) => event.preventDefault()}
            tabIndex={-1}
            type="button"
          >
            <CaretDown size={15} weight="bold" />
          </button>
        )}
        <ul
          aria-label="Brands"
          className="cat-brand__list"
          data-lenis-prevent=""
          hidden={!open}
          id={listId}
          ref={listRef}
          role="listbox"
        >
          {options.length === 0 ? (
            <li aria-disabled="true" className="cat-brand__none" role="option" aria-selected="false">
              No brand matches
            </li>
          ) : (
            options.map((option, index) => (
              <li
                aria-selected={option.brand === value}
                className="cat-brand__option"
                data-active={index === active}
                data-empty={option.count === 0}
                id={optionId(index)}
                key={option.label}
                onClick={() => choose(option)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActive(index)}
                role="option"
              >
                <span>{option.label}</span>
                <span className="cat-brand__count">{option.count}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
