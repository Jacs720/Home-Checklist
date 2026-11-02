# Organización por Pokédex

Las colecciones por marca de origen tienen dos controles independientes:

- **Orden de Pokédex:** nacional (valor inicial) o In-Game.
- **Únicamente Pokémon en la Pokédex:** desactivado inicialmente; oculta las especies que no figuran en las Pokédex asociadas a cada marca.

El orden se aplica dentro de cada marca. Las formas, géneros y variantes normal/brillante mantienen sus filtros y su orden relativo. La pertenencia a una Pokédex se comprueba por especie; no introduce formas que el catálogo de esa procedencia no admita.

Con orden In-Game, las especies sin número local se conservan al final de su marca, en cajas «Fuera de la Pokédex» ordenadas por número nacional. Activar el filtro las oculta. La casilla también funciona con el orden nacional.

Las colecciones especiales, incluido Pokémon GO, conservan sus reglas. Los perfiles de Living Dex sin separación por origen conservan su orden nacional; los controles quedan desactivados en ese modo.

## Marcas compartidas y expansiones

Una marca puede corresponder a varios juegos. Al no añadir un selector de juego, se utiliza la siguiente unión fija. Cada especie toma su primera aparición en esta lista, con el número original de esa Pokédex. Las siguientes Pokédex aportan únicamente especies todavía no incluidas; esto evita duplicarlas por aparecer en varias expansiones. Las variantes y formas que el usuario seleccionó siguen siendo ejemplares distintos.

| Marca | Pokédex, en orden de prioridad |
| --- | --- |
| Sin marca | Hoenn, Kanto, Sinnoh de Platino, Johto de HGSS, Teselia de B2W2 |
| Game Boy | Kanto, Johto de GSC |
| Game Boy Advance | Hoenn, Kanto |
| Pentágono | Kalos Central, Costa de Kalos, Montaña de Kalos, Hoenn de ORAS |
| Alola | Alola de USUM |
| Let's Go | Kanto de Let's Go, incluidos Meltan y Melmetal |
| Espada/Escudo | Galar, Isla de la Armadura, Nieves de la Corona |
| Leyendas: Arceus | Hisui |
| Diamante Brillante/Perla Reluciente | Sinnoh regional |
| Escarlata/Púrpura | Paldea, Noroteo, Arándano |
| Leyendas: Z-A | Ciudad Luminalia, Hyperspace |

Los nombres de Pokédex y números locales aparecen en la información del ejemplar, y en las casillas cuando está seleccionado el orden In-Game. Se respeta el número 000 de Victini.

## Progreso y copias de seguridad

El cambio reorganiza ejemplares existentes: no modifica sus identificadores ni elimina progreso o favoritos al ocultarlos. Ambos controles se guardan en la configuración y en las copias de seguridad. Las copias anteriores usan orden nacional y la casilla desactivada.

## Datos y actualización

La instantánea `public/data/pokedex-orders.json` contiene 22 Pokédex con sus números y nombres traducidos. Procede de los CSV del [repositorio oficial de PokéAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv), consultados el 1 de noviembre de 2026. La estructura corresponde al recurso [Pokédex de PokéAPI](https://pokeapi.co/docs/v2#pokedexes).

Actualizar desde la fuente:

```sh
npm run pokedex-orders:sync
```

Regenerar desde una descarga ya conservada, con fecha explícita:

```sh
node scripts/sync-pokedex-orders.mjs --source-dir artifacts/pokedex-sources --as-of 2026-11-01
```

El generador valida especies, números locales y duplicados antes de reemplazar la instantánea. Una actualización de datos debe revisarse con las pruebas del catálogo y la compilación compartida.
