// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useIngestion } from '../../src/react';
import { ColumnConfig } from '../../src/types';
import * as processModule from '../../src/core/processRowsInChunks';

describe('useIngestion', () => {
  const columnConfigs: ColumnConfig[] = [
    { key: 'name', displayNames: ['name'], type: 'string', validationRequired: true }
  ];

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useIngestion({ columnConfigs }));

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should process rows successfully', async () => {
    // We mock processRowsInChunks to resolve immediately
    const spy = vi.spyOn(processModule, 'processRowsInChunks').mockResolvedValue({
      totalRows: 1,
      validRowsCount: 1,
      invalidRowsCount: 0,
      validRows: [{ name: 'Test' }],
      invalidRows: [],
      errorsData: { rowWiseErrors: [] }
    });

    const { result } = renderHook(() => useIngestion({ columnConfigs }));

    const file = new File(["name\nTest"], "test.csv", { type: "text/csv" });
    await act(async () => {
      await result.current.startIngestion(file);
    });

    expect(spy).toHaveBeenCalled();
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.validRowsCount).toBe(1);

    spy.mockRestore();
  });

  it('should handle headers mismatch correctly', async () => {
    const { result } = renderHook(() => useIngestion({ columnConfigs }));

    const file = new File(["invalid_header\nTest"], "test.csv", { type: "text/csv" });
    await act(async () => {
      await result.current.startIngestion(file);
    });

    expect(result.current.error).toBe('Headers mismatch');
    expect(result.current.isProcessing).toBe(false);
  });

  it('should set pause state', () => {
    const { result } = renderHook(() => useIngestion({ columnConfigs }));

    act(() => {
      result.current.pause();
    });

    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.resume();
    });

    expect(result.current.isPaused).toBe(false);
  });

  it('should set cancel state', () => {
    const { result } = renderHook(() => useIngestion({ columnConfigs }));

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });
});
