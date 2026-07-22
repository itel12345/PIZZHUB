// src/components/menu/MenuPage.tsx
// Client component that owns menu-wide filter state and composes every
// Menu-page part in order. UI/UX only — no cart, auth, or database logic.

"use client";

import MenuHero from "./MenuHero/MenuHero";
import SearchBar from "./SearchBar/SearchBar";
import CategoryFilters from "./CategoryFilters/CategoryFilters";
import FilterSortRow from "./FilterSortRow/FilterSortRow";
import PizzaGrid from "./PizzaGrid/PizzaGrid";
import LoadMore from "./LoadMore/LoadMore";
import { useMenuFilters } from "./hooks/useMenuFilters";
import styles from "./MenuPage.module.css";

export default function MenuPage() {
  const {
    search,
    category,
    sort,
    results,
    totalCount,
    remaining,
    setSearch,
    setCategory,
    setSort,
    loadMore,
  } = useMenuFilters();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <MenuHero />

        <div className={styles.controls}>
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilters active={category} onChange={setCategory} />
        </div>

        <FilterSortRow sort={sort} onChange={setSort} resultCount={totalCount} />

        <PizzaGrid pizzas={results} />

        <LoadMore onClick={loadMore} remaining={remaining} />
      </div>
    </div>
  );
}
