"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { copy } from "@/data/copy";
import {
  plateStyles,
  getPlateStyle,
  type PlateLetter,
  type PlateStyleId,
} from "@/data/plateStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PlateStyleCard } from "./PlateStyleCard";
import {
  newItemId,
  useFunnelStore,
  type FunnelItem,
} from "@/store/funnelStore";
import { trackEvent } from "@/lib/tracking";

export function PlateSelectionStep() {
  const addItem = useFunnelStore((s) => s.addItem);
  const goToStep = useFunnelStore((s) => s.goToStep);

  const [selectedId, setSelectedId] = useState<PlateStyleId | null>(null);
  const [letter, setLetter] = useState<PlateLetter>("Q");
  const [plateNumber, setPlateNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedStyle = selectedId ? getPlateStyle(selectedId) : null;

  const handleSelect = (id: PlateStyleId) => {
    setSelectedId(id);
    setError(null);
    const style = getPlateStyle(id);
    if (style.supportsLetter && style.defaultLetter) {
      setLetter(style.defaultLetter);
    }
    trackEvent("SelectPlateStyle", { stepName: "plate_selection", extra: { plate_style: id } });
  };

  const handleNext = () => {
    if (!selectedStyle) {
      setError(copy.plateSelection.selectStyleError);
      return;
    }
    if (selectedStyle.requiresPlateNumber && plateNumber.trim().length === 0) {
      setError(copy.plateSelection.plateNumberError);
      return;
    }

    const item: FunnelItem = {
      id: newItemId(),
      plateStyle: selectedStyle.id,
      ...(selectedStyle.supportsLetter ? { plateLetter: letter } : {}),
      ...(selectedStyle.requiresPlateNumber
        ? { plateNumber: plateNumber.trim() }
        : {}),
    };

    addItem(item);
    goToStep(3);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-center text-2xl font-extrabold text-charcoal">
        {copy.plateSelection.title}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {plateStyles.map((style) => (
          <PlateStyleCard
            key={style.id}
            style={style}
            selected={selectedId === style.id}
            onSelect={() => handleSelect(style.id)}
          />
        ))}
      </div>

      {selectedStyle ? (
        <div className="space-y-4 rounded-lg border border-warmgray bg-white p-5 shadow-soft">
          {selectedStyle.supportsLetter && selectedStyle.letters ? (
            <div>
              <Label htmlFor="plate-letter">
                {copy.plateSelection.letterLabel}
              </Label>
              <Select
                id="plate-letter"
                value={letter}
                onChange={(e) => setLetter(e.target.value as PlateLetter)}
                options={selectedStyle.letters.map((l) => ({
                  value: l,
                  label: l,
                }))}
              />
            </div>
          ) : null}

          {selectedStyle.requiresPlateNumber ? (
            <div>
              <Label htmlFor="plate-number">
                {copy.plateSelection.plateNumberLabel}
              </Label>
              <Input
                id="plate-number"
                inputMode="numeric"
                value={plateNumber}
                onChange={(e) => {
                  setPlateNumber(e.target.value);
                  setError(null);
                }}
                placeholder={copy.plateSelection.plateNumberPlaceholder}
              />
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-md bg-maroon/5 p-4 text-sm leading-7 text-charcoal">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-maroon" />
              <span>{copy.plateSelection.customNote}</span>
            </div>
          )}
        </div>
      ) : null}

      {error ? <p className="field-error text-center">{error}</p> : null}

      <Button size="full" onClick={handleNext} className="text-lg">
        {copy.plateSelection.next}
      </Button>
    </div>
  );
}
