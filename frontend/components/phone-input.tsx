"use client"
import type { Country, Value } from "react-phone-number-input"

import * as React from "react"
import { LuChevronsUpDown, LuSearch } from "react-icons/lu"
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollShadow,
  Input as HeroUIInput,
  InputProps as HeroUIInputProps
} from "@heroui/react"

type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value | "") => void
    onCountryChange?: (country: Country) => void
    defaultCountry?: Country
  }

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({ className, onChange, onCountryChange, ...props }, ref) => {
      return (
        <RPNInput.default
          international
          ref={ref}
          className={`flex w-full gap-2 ${className}`}
          countrySelectComponent={CountrySelect}
          flagComponent={FlagComponent}
          inputComponent={InputComponent}
          smartCaret={false}
          onChange={value => onChange?.(value || "")}
          {...props}
          defaultCountry="MF"
          onCountryChange={country => onCountryChange?.(country)}
        />
      )
    }
  )

PhoneInput.displayName = "PhoneInput"

const InputComponent = React.forwardRef<HTMLInputElement, HeroUIInputProps>(
  ({ className, ...props }, ref) => (
    <HeroUIInput
      className={className}
      classNames={{
        label: "text-black"
      }}
      {...props}
      ref={ref}
    />
  )
)

InputComponent.displayName = "InputComponent"

interface CountrySelectOption {
  label: string
  value: Country
}

interface CountrySelectProps {
  disabled?: boolean
  value: Country
  onChange: (value: Country) => void
  options: CountrySelectOption[]
}

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options
}: CountrySelectProps) => {
  const [searchQuery, setSearchQuery] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const handleSelect = React.useCallback(
    (country: Country) => {
      onChange(country)
    },
    [onChange]
  )

  const isEuropeanCountry = (country: Country): boolean => {
    const europeanCountries = [
      "AT",
      "BE",
      "BG",
      "HR",
      "CY",
      "CZ",
      "DK",
      "EE",
      "FI",
      "FR",
      "DE",
      "GR",
      "HU",
      "IE",
      "IT",
      "LV",
      "LT",
      "LU",
      "MT",
      "NL",
      "PL",
      "PT",
      "RO",
      "SK",
      "SI",
      "ES",
      "SE",
      "GB",
      "IS",
      "LI",
      "NO",
      "CH",
      "UA",
      "MD",
      "BY",
      "RU",
      "MC",
      "SM",
      "VA",
      "AD",
      "AL",
      "BA",
      "ME",
      "MK",
      "RS",
      "XK"
    ]

    return europeanCountries.includes(country)
  }

  const filteredOptions = React.useMemo(() => {
    let filtered = options

    if (searchQuery) {
      filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort with European countries first
    return filtered.sort((a, b) => {
      const aIsEuropean = isEuropeanCountry(a.value)
      const bIsEuropean = isEuropeanCountry(b.value)

      if (aIsEuropean && !bIsEuropean) return -1
      if (!aIsEuropean && bIsEuropean) return 1

      return a.label.localeCompare(b.label)
    })
  }, [options, searchQuery])

  return (
    <Popover
      placement="bottom-start"
      radius="lg"
      onOpenChange={open => {
        if (open) {
          // Focus the search input when popover opens
          setTimeout(() => {
            searchInputRef.current?.focus()
          }, 0)
        }
      }}
    >
      <PopoverTrigger>
        <Button className="flex gap-1 px-3" disabled={disabled}>
          <FlagComponent country={value} countryName={value} />
          <LuChevronsUpDown
            className={`-mr-2 h-4 w-4 opacity-50 ${disabled ? "hidden" : "opacity-100"}`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[330px]">
        <div className="px-2 min-w-full">
          <Input
            ref={searchInputRef}
            className="mb-2 w-full"
            placeholder="Rechercher un pays..."
            startContent={<LuSearch />}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <ScrollShadow className="h-[300px] w-full">
            {filteredOptions
              .filter(x => x.value)
              .map(option => (
                <Button
                  key={option.value}
                  className="w-full justify-between gap-2 mb-1"
                  variant="light"
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="flex items-center gap-2">
                    <FlagComponent
                      country={option.value}
                      countryName={option.label}
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                  {option.value && (
                    <span className="text-default-500 text-sm">
                      {`+${RPNInput.getCountryCallingCode(option.value)}`}
                    </span>
                  )}
                </Button>
              ))}
          </ScrollShadow>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface FlagProps {
  country: Country
  countryName: string
}

const FlagComponent = ({ country, countryName }: FlagProps) => {
  const Flag = flags[country]

  return (
    <span className="bg-default-200 flex h-4 w-6 overflow-hidden rounded-sm">
      {Flag && <Flag title={countryName} />}
    </span>
  )
}

FlagComponent.displayName = "FlagComponent"

export default PhoneInput
