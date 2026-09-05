import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecommendationTabs from '../../src/features/recommendations/components/RecommendationTabs';

describe('RecommendationTabs component', () => {
  const sampleProps = {
    diet: ['Eat leafy greens', 'Increase fiber intake'],
    foodsToAvoid: ['Avoid processed sugars', 'Reduce sodium'],
    exercise: ['30 minutes walking daily', 'Light aerobic activities'],
    lifestyle: ['Ensure 8 hours of sleep', 'Hydrate adequately'],
  };

  it('renders all 3 tabs (Diet Plan, Exercise, Lifestyle Tips)', () => {
    render(<RecommendationTabs {...sampleProps} />);

    expect(screen.getByRole('button', { name: /diet plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exercise/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lifestyle tips/i })).toBeInTheDocument();
  });

  it('Diet Plan tab shows both diet[] and foodsToAvoid[] items', () => {
    render(<RecommendationTabs {...sampleProps} />);

    expect(screen.getByText('Eat leafy greens')).toBeInTheDocument();
    expect(screen.getByText('Increase fiber intake')).toBeInTheDocument();
    expect(screen.getByText('Avoid processed sugars')).toBeInTheDocument();
    expect(screen.getByText('Reduce sodium')).toBeInTheDocument();
  });

  it('switching tabs shows correct list content for Exercise and Lifestyle Tips', () => {
    render(<RecommendationTabs {...sampleProps} />);

    // Click Exercise tab
    const exerciseTab = screen.getByRole('button', { name: /exercise/i });
    fireEvent.click(exerciseTab);

    expect(screen.getByText('30 minutes walking daily')).toBeInTheDocument();
    expect(screen.getByText('Light aerobic activities')).toBeInTheDocument();

    // Click Lifestyle Tips tab
    const lifestyleTab = screen.getByRole('button', { name: /lifestyle tips/i });
    fireEvent.click(lifestyleTab);

    expect(screen.getByText('Ensure 8 hours of sleep')).toBeInTheDocument();
    expect(screen.getByText('Hydrate adequately')).toBeInTheDocument();
  });

  it('empty category array renders fallback text', () => {
    render(
      <RecommendationTabs
        diet={[]}
        foodsToAvoid={[]}
        exercise={[]}
        lifestyle={[]}
      />
    );

    expect(screen.getByText(/no specific recommendations in this category/i)).toBeInTheDocument();
  });
});
