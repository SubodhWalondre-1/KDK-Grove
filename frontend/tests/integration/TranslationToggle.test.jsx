import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LanguageToggle from '../../src/features/translation/components/LanguageToggle';
import { useTranslatedLabels } from '../../src/features/translation/hooks/useTranslation';
import * as translationApi from '../../src/api/translationApi';
import { useUIStore } from '../../src/store/uiStore';

vi.mock('../../src/api/translationApi', () => ({
  getLanguages: vi.fn(),
  bulkTranslate: vi.fn(),
}));

function TestConsumerComponentA() {
  const items = [
    { source_type: 'test_name', source_key: 'Hemoglobin' },
  ];
  const { translations, isLoading } = useTranslatedLabels(items);
  return (
    <div>
      <span data-testid="consumer-a-loading">{isLoading ? 'Loading...' : 'Done'}</span>
      <span data-testid="consumer-a-text">
        {translations.get('test_name:Hemoglobin') || 'Hemoglobin'}
      </span>
    </div>
  );
}

function TestConsumerComponentB() {
  const items = [
    { source_type: 'test_name', source_key: 'Blood Sugar' },
    { source_type: 'status_label', source_key: 'Normal' },
  ];
  const { translations } = useTranslatedLabels(items);
  return (
    <div>
      <span data-testid="consumer-b-text1">
        {translations.get('test_name:Blood Sugar') || 'Blood Sugar'}
      </span>
      <span data-testid="consumer-b-text2">
        {translations.get('status_label:Normal') || 'Normal'}
      </span>
    </div>
  );
}

function TestHarness() {
  return (
    <div>
      <LanguageToggle />
      <TestConsumerComponentA />
      <TestConsumerComponentB />
    </div>
  );
}

describe('TranslationToggle Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({ activeLanguage: 'en-IN' });

    translationApi.getLanguages.mockResolvedValue({
      languages: [
        { code: 'en-IN', name: 'English' },
        { code: 'hi-IN', name: 'Hindi' },
      ],
    });
  });

  it('test_language_switch_triggers_single_bulk_call', async () => {
    translationApi.bulkTranslate.mockResolvedValue({
      language_code: 'hi-IN',
      translations: [
        { source_type: 'test_name', source_key: 'Hemoglobin', translated_text: 'हीमोग्लोबिन', method: 'glossary' },
        { source_type: 'test_name', source_key: 'Blood Sugar', translated_text: 'रक्त शर्करा', method: 'glossary' },
        { source_type: 'status_label', source_key: 'Normal', translated_text: 'सामान्य', method: 'glossary' },
      ],
    });

    render(<TestHarness />);

    // Initially in English, 0 bulk calls
    expect(translationApi.bulkTranslate).not.toHaveBeenCalled();
    expect(screen.getByTestId('consumer-a-text')).toHaveTextContent('Hemoglobin');

    // Open language toggle
    const toggleButton = await screen.findByRole('button', { name: /english/i });
    fireEvent.click(toggleButton);

    // Select Hindi
    const hindiOption = await screen.findByRole('button', { name: /hindi/i });
    fireEvent.click(hindiOption);

    await waitFor(() => {
      expect(screen.getByTestId('consumer-a-text')).toHaveTextContent('हीमोग्लोबिन');
    });

    // Verify bulkTranslate called per hook subscriber (each consumer hooks once for its batch)
    expect(translationApi.bulkTranslate).toHaveBeenCalledWith(
      [
        { source_type: 'test_name', source_key: 'Hemoglobin' },
      ],
      'hi-IN'
    );
  });

  it('test_language_switch_updates_all_consumers_together', async () => {
    translationApi.bulkTranslate.mockImplementation((items, lang) => {
      if (lang === 'hi-IN') {
        const translations = items.map((item) => {
          if (item.source_key === 'Hemoglobin') return { ...item, translated_text: 'हीमोग्लोबिन', method: 'glossary' };
          if (item.source_key === 'Blood Sugar') return { ...item, translated_text: 'रक्त शर्करा', method: 'glossary' };
          if (item.source_key === 'Normal') return { ...item, translated_text: 'सामान्य', method: 'glossary' };
          return { ...item, translated_text: item.source_key, method: 'fallback' };
        });
        return Promise.resolve({ language_code: 'hi-IN', translations });
      }
      return Promise.resolve({ language_code: lang, translations: [] });
    });

    render(<TestHarness />);

    const toggleButton = await screen.findByRole('button', { name: /english/i });
    fireEvent.click(toggleButton);

    const hindiOption = await screen.findByRole('button', { name: /hindi/i });
    fireEvent.click(hindiOption);

    await waitFor(() => {
      expect(screen.getByTestId('consumer-a-text')).toHaveTextContent('हीमोग्लोबिन');
      expect(screen.getByTestId('consumer-b-text1')).toHaveTextContent('रक्त शर्करा');
      expect(screen.getByTestId('consumer-b-text2')).toHaveTextContent('सामान्य');
    });
  });

  it('test_switching_to_english_skips_api_call', async () => {
    // Start in Hindi
    useUIStore.setState({ activeLanguage: 'hi-IN' });
    translationApi.bulkTranslate.mockResolvedValue({
      language_code: 'hi-IN',
      translations: [
        { source_type: 'test_name', source_key: 'Hemoglobin', translated_text: 'हीमोग्लोबिन', method: 'glossary' },
      ],
    });

    render(<TestHarness />);
    await waitFor(() => {
      expect(screen.getByTestId('consumer-a-text')).toHaveTextContent('हीमोग्लोबिन');
    });

    translationApi.bulkTranslate.mockClear();

    // Switch back to English
    const toggleButton = await screen.findByRole('button', { name: /hindi/i });
    fireEvent.click(toggleButton);

    const englishOption = await screen.findByRole('button', { name: /english/i });
    fireEvent.click(englishOption);

    await waitFor(() => {
      expect(screen.getByTestId('consumer-a-text')).toHaveTextContent('Hemoglobin');
    });

    // Zero API calls when switching back to English
    expect(translationApi.bulkTranslate).not.toHaveBeenCalled();
  });

  it('test_loading_state_during_translation', async () => {
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    translationApi.bulkTranslate.mockReturnValue(pendingPromise);

    render(<TestHarness />);

    const toggleButton = await screen.findByRole('button', { name: /english/i });
    fireEvent.click(toggleButton);

    const hindiOption = await screen.findByRole('button', { name: /hindi/i });
    fireEvent.click(hindiOption);

    // Should show loading state while promise is pending
    await waitFor(() => {
      expect(screen.getByTestId('consumer-a-loading')).toHaveTextContent('Loading...');
    });

    // Resolve the promise
    await act(async () => {
      resolvePromise({
        language_code: 'hi-IN',
        translations: [
          { source_type: 'test_name', source_key: 'Hemoglobin', translated_text: 'हीमोग्लोबिन', method: 'glossary' },
        ],
      });
    });

    // Should show Done after resolution
    await waitFor(() => {
      expect(screen.getByTestId('consumer-a-loading')).toHaveTextContent('Done');
      expect(screen.getByTestId('consumer-a-text')).toHaveTextContent('हीमोग्लोबिन');
    });
  });
});
