import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import QuantityStepper from "@/components/QuantityStepper";

describe("QuantityStepper", () => {
  it("renders the current value", () => {
    render(<QuantityStepper value={2} onChange={() => {}} />);
    const input = screen.getByDisplayValue("2") as HTMLInputElement;
    expect(input).toBeInTheDocument();
  });

  it("decrements when minus is clicked", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={3} onChange={onChange} min={1} max={10} />);
    fireEvent.click(screen.getByLabelText("Decrease quantity"));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("increments when plus is clicked", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={3} onChange={onChange} min={1} max={10} />);
    fireEvent.click(screen.getByLabelText("Increase quantity"));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("disables the minus button at the min value", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={1} onChange={onChange} min={1} max={10} />);
    const dec = screen.getByLabelText("Decrease quantity");
    expect(dec).toBeDisabled();
    fireEvent.click(dec);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables the plus button at the max value", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={10} onChange={onChange} min={1} max={10} />);
    const inc = screen.getByLabelText("Increase quantity");
    expect(inc).toBeDisabled();
    fireEvent.click(inc);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clamps decrement result at the min value", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} onChange={onChange} min={1} max={10} />);
    fireEvent.click(screen.getByLabelText("Decrease quantity"));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("clamps increment result at the max value", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={9} onChange={onChange} min={1} max={10} />);
    fireEvent.click(screen.getByLabelText("Increase quantity"));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("typing a value clamps it within range", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} onChange={onChange} min={1} max={5} />);
    const input = screen.getByDisplayValue("2");
    fireEvent.change(input, { target: { value: "0" } });
    expect(onChange).toHaveBeenCalledWith(1);
  });
});