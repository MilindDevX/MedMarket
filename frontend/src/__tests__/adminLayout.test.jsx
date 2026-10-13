/**
 * AdminLayout — the sidebar is hidden on narrow screens, so a menu button
 * must open it and choosing a link must close it.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';

const renderLayout = () => render(
  <MemoryRouter initialEntries={['/admin/dashboard']}>
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<p>Dashboard page</p>} />
        <Route path="orders" element={<p>Orders page</p>} />
      </Route>
    </Routes>
  </MemoryRouter>
);

describe('AdminLayout mobile navigation', () => {
  it('opens the menu, navigates, and closes again', () => {
    renderLayout();
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('link', { name: /All Orders/ }));
    expect(screen.getByText('Orders page')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the menu with Escape', () => {
    renderLayout();
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
