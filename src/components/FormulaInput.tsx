import React, { useState, useEffect, useRef } from "react";
import Mexp from "math-expression-evaluator";
import { useGetAutoComplete } from "@/hooks/use-autocomplete";
import type { FormularResponse, GroupedOptions } from "@/types/formula";

const FormulaCalculator = () => {
  const [tokens, setTokens] = useState<
    Array<{ type: "text" | "token"; value: string; option?: FormularResponse }>
  >([{ type: "text", value: "= " }]);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<FormularResponse[]>(
    []
  );
  const [result, setResult] = useState<number | string | null>(
    "Enter an expression"
  );
  const [currentSearch, setCurrentSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: options } = useGetAutoComplete();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        dropdownRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (options && options.length > 0) {
      setFilteredOptions(options);
    }
  }, [options]);

  const groupedOptions: GroupedOptions = filteredOptions.reduce(
    (acc: GroupedOptions, option: FormularResponse) => {
      const category = option.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(option);
      return acc;
    },
    {}
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newTokens = [...tokens];
    const lastToken = newTokens[newTokens.length - 1];
    if (lastToken && lastToken.type === "text") {
      lastToken.value = value;
    } else {
      newTokens.push({ type: "text", value });
    }
    setTokens(newTokens);
    const words = value.trim().split(" ");
    const searchTerm = words[words.length - 1];
    if (searchTerm) {
      setCurrentSearch(searchTerm);
      setIsOpen(true);
      const filtered = options?.filter((option) =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered ?? []);
    } else {
      setIsOpen(false);
      setCurrentSearch("");
    }
    calculateResult(newTokens);
  };

  const handleOptionClick = (option: FormularResponse) => {
    const newTokens = [...tokens];
    const lastToken = newTokens[newTokens.length - 1];
    if (lastToken && lastToken.type === "text") {
      const words = lastToken.value.trim().split(" ");
      words.pop();
      lastToken.value = words.join(" ") + (words.length > 0 ? " " : "");
    }
    newTokens.push({ type: "token", value: option.name, option });
    newTokens.push({ type: "text", value: " " });
    setTokens(newTokens);
    setIsOpen(false);
    setCurrentSearch("");
    calculateResult(newTokens);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleDeleteToken = (index: number) => {
    const newTokens = [...tokens];
    if (index > 0 && newTokens[index - 1].type === "text") {
      const prevToken = newTokens[index - 1];
      const endsWithOperator = /[+\-*/^%]\s*$/.test(prevToken.value);
      if (endsWithOperator) {
        prevToken.value = prevToken.value.replace(/[+\-*/^%]\s*$/, "");
      }
    }
    newTokens.splice(index, 1);
    for (let i = 0; i < newTokens.length - 1; i++) {
      if (newTokens[i].type === "text" && newTokens[i + 1].type === "text") {
        newTokens[i].value += newTokens[i + 1].value;
        newTokens.splice(i + 1, 1);
        i--;
      }
    }
    setTokens(newTokens);
    calculateResult(newTokens);
  };

  const calculateResult = (
    tokenList: Array<{
      type: "text" | "token";
      value: string;
      option?: FormularResponse;
    }>
  ) => {
    try {
      const formula = tokenList.map((token) => token.value).join("");
      let expression = formula.startsWith("= ") ? formula.slice(2) : formula;
      expression = expression.trim();
      if (!expression) {
        setResult("Enter an expression");
        return;
      }
      let workingExpression = expression;
      for (const token of tokenList) {
        if (token.type === "token" && token.option) {
          const value =
            token.option.value !== "" ? Number(token.option.value) : 0;
          workingExpression = workingExpression
            .split(token.value)
            .join(value.toString());
        }
      }
      options?.forEach((option) => {
        const placeholder = option.name;
        const value = option.value !== "" ? Number(option.value) : 0;
        workingExpression = workingExpression
          .split(placeholder)
          .join(value.toString());
      });
      const endsWithOperator = /[+\-*/^%]$/.test(workingExpression);
      if (endsWithOperator) {
        setResult("Incomplete expression");
        return;
      }
      const hasUnresolvedPlaceholders = /[a-zA-Z][a-zA-Z0-9\s]*/.test(
        workingExpression
      );
      if (hasUnresolvedPlaceholders) {
        setResult("Unknown variables in expression");
        return;
      }
      const mexp = new Mexp();
      const result = mexp.eval(workingExpression);
      setResult(result);
    } catch (error) {
      setResult("Error: Invalid expression");
      console.error("Calculation error:", error);
    }
  };

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100">
      <div className="relative w-[400px]">
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          className="flex flex-wrap items-center w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus-within:border-blue-500 bg-white min-h-[42px]"
        >
          {tokens.map((token, index) => (
            <React.Fragment key={index}>
              {token.type === "token" ? (
                <div className="flex items-center bg-gray-100 border border-gray-300 rounded px-2 py-0.5 mr-1">
                  <span>{token.value}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteToken(index);
                    }}
                    className="text-gray-500 hover:text-gray-700 ml-1"
                  >
                    X
                  </button>
                </div>
              ) : token.value && index === tokens.length - 1 ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={token.value}
                  onChange={handleInputChange}
                  onFocus={() => {
                    if (currentSearch) setIsOpen(true);
                  }}
                  className="flex-grow outline-none min-w-[50px] p-0"
                  style={{ margin: 0 }}
                />
              ) : (
                <span className="whitespace-pre">{token.value}</span>
              )}
            </React.Fragment>
          ))}
          {tokens.length === 0 ||
            (tokens[tokens.length - 1].type !== "text" && (
              <input
                ref={inputRef}
                type="text"
                value=""
                onChange={handleInputChange}
                className="flex-grow outline-none min-w-[50px] p-0"
                placeholder="Enter formula"
                style={{ margin: 0 }}
              />
            ))}
        </div>
        {isOpen && filteredOptions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-[300px] overflow-y-auto z-10"
          >
            {Object.keys(groupedOptions).map((category) => (
              <div key={category} className="p-2">
                <div className="px-3 py-1 text-xs text-gray-500 uppercase font-bold">
                  ◉ {category}
                </div>
                {groupedOptions[category].map((option) => (
                  <div
                    key={option.id}
                    className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleOptionClick(option)}
                  >
                    {option.name} {option.value ? `(${option.value})` : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 text-base">
        <p>
          Result: <strong>{result}</strong>
        </p>
      </div>
    </div>
  );
};

export default FormulaCalculator;
