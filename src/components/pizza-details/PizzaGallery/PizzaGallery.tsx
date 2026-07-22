// src/components/pizza-details/PizzaGallery/PizzaGallery.tsx
//
// Large single hero image for the pizza details page. No slider — the
// spec is explicit that one beautiful image is enough for now, with
// multi-image gallery support left for later.

import Image from "next/image";
import styles from "./PizzaGallery.module.css";

interface PizzaGalleryProps {
  image: string;
  name: string;
}

export default function PizzaGallery({ image, name }: PizzaGalleryProps) {
  return (
    <div className={styles.gallery}>
      <Image
        src={image}
        alt={name}
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
        className={styles.image}
      />
    </div>
  );
}