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
    loading,
    search,
    category,
    sort,
    results,
    totalCount,
    remaining,
    hasMore,
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
          <SearchBar
            value={search}
            onChange={setSearch}
          />

          <CategoryFilters
            active={category}
            onChange={setCategory}
          />
        </div>

        <FilterSortRow
          sort={sort}
          onChange={setSort}
          resultCount={totalCount}
        />

        {loading ? (
          <div
            style={{
              padding: "5rem 0",
              textAlign: "center",
              fontSize: "1.05rem",
              opacity: 0.7,
            }}
          >
            Loading pizzas...
          </div>
        ) : (
          <>
            <PizzaGrid pizzas={results} />

            {hasMore && (
              <LoadMore
                onClick={loadMore}
                remaining={remaining}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}