import { groupName } from "../translations";
import { GAME_PLANS } from "../collection-features";
import { pokemonArtworkUrl } from "../catalog-planner";
import { OriginMarkIcon, StyledSelect, originMarkIconUrl } from "../components/ui-controls";
import type { AppController } from "../hooks/use-app-controller";
import { HomeChallengeSummary } from "../HomeChallengeSummary";

type SummaryViewProps = { app: AppController };

const BREAD_SUPPORT_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAABllSURBVHhe7ZwJdFRVtoaP2KKEQbEVnNqpW1FobVtbW9EnjUQBcUIBRUAQUVtEpVVEkUZmBJkaCfMUZhBEUMaMZCQh81ipyliVGlLznBqSfG+dm0DzSt96Pl/DE9p/rb1qpXLrVp2v9t5n73PPLSF+0S/6Rf9muk4I8boQYkmbzRBC9BVCXBR54L+jPm7fvr1jyJAhzJwxg7lz5/Lee+/Rs2dPhBDFQojRkS+40HW1EOL3Qog/CCHevvaa7pzISCdS4aYmvv5qN7+99RYJaocQIiryRBeaHhBCxHW47DLnDddfR4/bfkfPO3qwPXbDaShetwuLoR6ryYDf44ZwEF11JYMGDpSQjgkhLo086YWgPwsh5gkhfOPfeI2kw99SmJ1OeX42hSdSqa0oxety0tTUhMWox1yvxazXKqDMeh0+px2/007fPo9KSGsiT36+a1SXzp0Z8dIw1q9cTk1ZIeb6WuwNRsXK8rJRFebi87gJhUKtUOq1OCxm/D5vqzcZDQqk9MSjdL3iCgnpwcg3OZ+Vv2TBXAg30qCrUTzHatJjNeoVQFVlxQogv9dLMBA47TkSltthU46rr6mkKDsDbUUx745/UwLaGfkm57OWPv/s0zgbDNgaTBRlp6OrUmMzGZTBG2qrqVOX4/d6CDRKiHX4PB5CwYDiObpqDXkZx8lJS0KrLiF2zUoJSBX5JuezrhRC6JcsmEfQ66JGVUppbpYCqDV89Fj0Orwul+JBTpuF5uYW5dFQW0X+iVTy0pOpKS8k63gC9/3xHgloReSbnO964squV5B5PAG3zUJhVjr6mqrTkGTOkbNXc0szzS0tNPq8ynMlOScoyEyhTlXMlnWr+e0tynS/TgjRPvINLgStfPCBP2GsraSqvJjyghxsJuPpmSrQ6KelBcLhMA5zA5rSQoqz06ksyee9t9+SYLxCiL9HnvRC0mVCiIK33xiH3ahTcpGhrro1xAz1BIMBBZDH6aC+WkNlcZ7iadHRSv3DJe1E8MrO7fRCiOmRJ76Q1EsIEYpZuohalZy98k6HWTgUIhhoVIBp1SpiN26hxx13cetVgukvdqZsWXc2vdtVwjJFnvRC07BOHTsGD3/zNdWqcuwWG42+oFJFNzdBXbWOjz/8gH53X8qm8ZeiX38NBYu7MWfE5fS4/pKgEGJa5AkvRH39l/tvYd3cV9n8j0nsWTeDbzbPY//m+excMIwtEy4jcfrlLBzThT/9rr0SYkKIsHydEGKAEOIuIcSvIk96ISl3+fjfkL3sd2yb2IkNf72Yne9ezOTnfsU3kzti39yddeO78s6TnXgtOopX+0Uxsk8H+v8xit69LufW6zrQ7iKlFpK93XktWQP9uu1Rmvzmd193za9bFr1xPSe/vI3UuVcRN/VSDk/pwJQXLuOpPwo+fvYSNk24nIQZVynhpYnpTs2qbgQO3Aup0ZAVzeyxypS/O/INzxddIz98hw6X2bp2vcIeFdXB1rlzJ1u3ble3jBw+jBNJx0j+dhPLpo1g6SfPseTjp1k6ZShblk9l+PBRdO567amw4lcXieZul7ez3NztYte9t3ViwP1X8u7g67nv9s7y/+fltP+irJxfHPI8SUe+JTM5juSjB5UOPi3+MNVlBUrdY9DqUJeW4nV7sZktlObnUZqfi82go7K0iA2rYnhm0JNc1qFjsxAiUwjxVltIDRJCTBBCDD3f8lBnWeVef921rFq2GEt9rVI1W/RaKksKKMpKQ12cr0zpJl0dJ1MTqFa1LnPYGowUncxQwMhjXDYrQa9b6d/Sk+L48L0J3HrzTSEhxNE2MOed7hZClD41oL/SL7nMRqWeUZcUUHwyE01JIdoqNS6HHbvDRllpEYU5J3DYrPj9PlwuB2p1GWZzA/XaGjTlJQRCIaVo9Lmc+F12KoryWL54AY889GcZWrJgXCCEuDHyg/wc9ZIQwvnhxHfQV6lwyHUes4mKwjyKc05g0tcTaGrC43Ghyc0mMXYdX037hLLkBCqSkyk8sJ+ib/excfQI9k+fjiYjg5LUZLJ3bcXn8Sk9mtftxOO047Vb0KrL+GrbJoYOfpb27du7hBCzhRDdIz/Uz0Vz5QLWiqULsRm0SlUs4TgsDRj1OpwOO6bqSo7Mns6Sh+9nxnVdmNdNsPHRm6lNO0LprsWUbJ1DVeI+Eic8SPKE+yjZuQR9bgr73h5F5orPsZusWLV1OExGJfScVgtOi4kGbRUHvtpB/+jHpEfp2ta3fza6SQiRcP999xL37T6cZoPSeNotDYqneFwOdMWFZG3dwvIHe7HkGkH80zdQO+NBGnc8TIsqhqA5n+aqTbTUbCHorALVNEiLprl8GaGa/TRaK3DGf4hXtQ+7wYClSkVDpRpLbQ12o0FZTLOZjUrLMrG1mTX/XCD1EELUjxszCnVhDna58GUy4HLY8Hrc6IoLyNq8noTPp3PwxXspfO1WwusGwaHBkDoI0p+n0XCCxtpjBMvXE1RvxWerI5w/Cw4/RFP2B8pzAV0iQXMezZmvE6hPxuey4DFXYdeqMVdWYFSrKE44QoNciDPVM2XS+6cgyXz4/6bLhRBVH7z7NsYaNRaDTpmBPB431notubu2kThvGpn/mEnhlCdxLngIkmfTcug5SHoS4voSzpuJz6IhqNlBULWRoGYnXoeRUPESOPIfkPQCQdV6ghWx+I0FBGoO05w6Gr8xD5+zAb+tBp+tFpexltV97yN2xDCMujo8LvuZkH4b+cHPlb587qlBmGo1ChyZb7xeNzU5WSQtmkfagimUbV5I5dKx+Jc8SPOhybQUL4C0AZAyCJKeJlAbh9+Y3wpHAbQbr6OBUEkMHO0DcdEKRAWgZgc+ay3B8rW0pIzEZ1bhsxvx2WoI+RoonT2SpVcJVkQ/RE1RAV6Xg4/+9q6EpBZC3BD54c+2rrzkkkt83+3dhctiwqHA8aBOSSJ+9qfkxXxG5Y6FlK/4EMvc3rgX9sYZvxDb7qHYVt+NK/ZeGpPfwW+tJGhIoalqI+HKWIJVe/A6zQRLV7UBeoKW1FEE1dsIqjYQqDuGz66jKedjmtNG47NW4bMb8Ln0hA9+iH7KvWy7J4qdo4dQV1xIwOfmvdaFfY0QomfkIM6m/nTzTTcqdY2cpXw+L+rUZBLmTKFk7Qw0W+ZQuvJjEp6+mqOPCNLffBDNnuVkvP0oycN7EP9Mdyq2LsBeW0H9sQ3o9s/FnrYMX/kufC4rTRVr4GhviHsc4p8gnD+TYMVmguXr8JuK8JkrFC9qypqI12nF5zIS2juOlvVPoJ/6AOkfDiNx4TyMZcUE/R4mvTfhnCfu3r3uvIOKwlycdiu6shKS5k+nZM0MNJtnU/31Cqp2LaJ68zSsmXvwGtSE3AZaPHU0u2oIGMvwWvR4rCasJSfQJu5Fs/tLqvbG4DQacKbOJxQ/FDLHwLFHac54i8b6dALV+2jUJipe06hLpSXxGZryJhEs2Uhw4/OE1gwgvOZxTFsmk7d2EUmLP8du1OOympg08Z1TkOTEctbVs3u3q8nNSMFsqCczdh25X05Df2gltvxjBBx6mkMuwAfNHkJ+B81ePfjqwK+DRgMBr52A20pTo53moIuQ24xHX4nXYaPyqy+pPrQZV/kRmg/3hYLJyuzms2uVnCMTs/xbhl7L170Jr+tDcPVAgmufJLy2P96j86k/HMv+t0ay74Px+IMBpTab8ObrElJlWwN9VhV1cbt2hoPf7MFQUU7q4tloDyzHUXCYsM9C2Gcl6G44bSG3UfEePLWnrdFlIew2KBZymwh7Ggj5rPg9TuU6vFOrxlSSi3rtRPRrXyLYUIa/vhBfQyVec61iPr2KwN6JBGP+osAJrhlIcN0gAmkrsaXsIHnCc8y+Nop6ValSehiqKhg+9AUJ6fi5uBqSvDJmGYbiAjKXzcGcshW/SU3Yb6PZo6XZo6PJo1cezwRzygJus/I/eWwrRJNifpdVMdxVitdZNOVo9qzGUX6CQE02/ooUfPUqfIZKfLoy/Pn7CK54jODKNtv8IoGcbTjTtpA/MZq5VwjSN67B2+hXmuWs4/Fc2VVZz74+ckD/ah2aPXM6+vyTZK+chyPvW0JeC2GPETw1EfZ9QGd6lPSwU4ACLiNhWwWYs8CaR8hnx20xUZ+fjmXvDMLrnyLw3RT8Rd/i05XiNetoTFpCYNsoJQ81HpxKoGAPjvgYCt+8j+U3tePA3yfjk1dnDToSD+2nY8co2bddFTmgf7U2TZ70AbqcLLJXzMVVEkfIZ6PJU//fQvlhq1Fec8qLgm4zYbsaLCcVa7KW0uhz4zRoSRl7H/pPetGyth/Blf1oTFiIt6EWX2UG/tzd+HN24j+5nVDRHhp2Tyf3lTvYes9lJH02Hm9jAJtRpyy/yEtO52K32sr3J75DXW42J1fOw1WSoOSeyFzzY6zFoz3tQRJU2KUDSy5YchRIYbuGUNBL+oS+pD7VkdD6pwitfIzAjrH48/bSGP8FgT3jCSd9Tih3C4052yn/+zNkj+hBQnRHCha8icsXwKqvQ7ZFQojlkYM5G1o9Yfyb1JcUkLNmIbbc7wj7Gr43+B9r4bYwUwDJMHWUgVl6kQR1EsI6tPuW8t2DAtsXfWha15/ArnE05u8l/NUbhGIeRTf1ASo+7kvhxD5kjbiDnFfvJrFfewqX/Q1fqBmtppx77r5LAno+cjBnQ6vffG0MxhoNeVtWY0reRthZB97/vQfJMJMJ+9SsJ2c2JUyteW1elAs+FY7c/Xz3SDv00/8MmwcR3DUOf/p6/KsGUTnpAdJfupMTw28n6+UenBz9e8XiHmtP9bGdhFogIymOjlEdAueq9Vj55muvKn1Y+eF96A6uImgsba1zvgfgfzYZmqc9SAKSoB2lYG4D5FdjO7GXg4+0wzr/EWxfPEbppL6UzRpBzit3cmJkr9NQpOWMuYvMYbeQ+MJvsOvraG4Ksal1u0xZ5EDOljZ8/MFE7GYjNVlp1O6PwV+dCY367w3+x1rYrT/Dg+rApWn1IBlqzXqqts3iWB+B+oP7yRrZixMj7lRCKfuV/wpHATT2DyRGdyBv7qsEWqCp0cvkDyZKQLGRAzlbOjx72qeKBxlUpdR9txpPxXGlSo4c+I+zGiVZ/xNQ63NY8sCaS4u3jtRx95M08HKyX/k92aN6cvKVnt8D02p3kT3yTuKf6EhDUSbBcDMem4WnBjwhAb0dOZCzpcML5szA1qCnoUpD3cE1uMuTwCun+J+Sh1qtya1XQLX+XQdONYRNmJM2c/gRQdbLt6Ne8RHqmEltkKT33MXJMa0mQyt37D0k9+9E4cLxivfIyrxOXcYdt98mAf0lciBnS4cWzpulLHVYtdXoj23AWZIAjnJwqX9isv4Bk+fBSf5nLxDX52IKJvajbv8adIdiKZ46hOyXbyN7dKtHZY3qqTymPH01x1/ugaWmEp+/EZ/LQUZSPFEdOjS27eI/J4r7ctECXFYzVl0NhriNOMuSaXJWtuYNd/W/BpK/niabmqRht5DyZFfK541Fe2A9dd+spnrLPNKH3Uz8wC7ED7xcsWOPd+BYv0upjduNw2pX1qvlpaKtG9ZK7yk9FwWi1MVCiIodm9bhtJix1FUrgFxlxwm724o8a77ST+E9FS4/0cJmXEXHOBodRcbQG5Xw0h5YR+2e5dTsjSH9jQc48uhFxPXvSNwTHTnUW1C6/H1cFgu2ei1Oq5lGt4Npn3wkAZ2z6/ed2rdv33D0wD5l+65Vr8WUtBVXWbKy7tNsLWprFXJbQ+7/kJNosWM+vo0jj7Yja+QdVG2cqXiPZut81Nu+oGjhW4rHSEBHHhWkjb0Hp66KBnU5tSczcdltSi83ZPCzEtA5u37fqXOnTqbjxw4pm7wttRpMCa0eJAE12VRtgNqmaHvJT4ckASXFKl5ycszdVG+dT+WORag2zaYidg7q7V+QOqonR/pczNG+7dEe24HPYaNk9wZKj3ynXF2pr1IrtzkIIfpHDuRsqVOnjh2NEpD8hsxVpdRtnYxLlUrIrSfk1IJdFnlnQJKtw0/JSdgxJ25SZrCTr92LWoLZPFeBI02zczEFc0Zz8E+C/Jkj8DodmLKOkr3oIyqOJxDw+ziZdlwmaFlBn7ME3SkqqoMpJe4wbglIW0XlwhdwnNhO2Gcm6KynxVsPTulJshJuM1flGZ70I2G12LCkbFMApQy9mfJ101Bv+fw0IAlLtXEm6a/fT0N+KvaaCjRb55Hzjylo0o4TDgXY2FpBy1upzpk6Sg9KSziK22HHXFeJ5ovBuFJX0uzTE7BraXHLKVrbOuWfahckIMWLatpg/QhQzVbs2d9w6GFBwjNXU77us/8KKHYOqvXT0R7djttspO7IFirWT1OWgKuzT+B2WBk3Wung5Y1550xdu3TqZM1Mjlc8yKKrRrPkRdzpa8Bd3pqkbUWtMCQkpwasheCuaX3OXtwadvKY/6kcCJporEolddi1xA3oQvnqT1Fvnf89QOaSLKyqfCo2zlIuHOR++RnqzDS0VSr6PPKwBHROb8S7+eqrfh3KzUhVNhDIfT6Vy8fgzlwH7tKIvKNtNTnln4JhK/znMbJjV8qB/wZSo4FmcyElH/8HRx+7lNIv30e9bcE/4WyciWbHYhx1Gmq+3aB4mLzslP2PaVRkpGHS1TJr2qen1qHPmW6+pnu3UEFWOk5LA5YGM1Vr3sJ1PEbxoNY1nNzW0JKQZBgp9VDbcohsH06FnZKf2iD9ULj562mxlaOaNZCjf7mYwvmvo9m+8DSg8rV/x5BxCHNRJqr1n7Um7s1zOLH0M2oL8rBbzaiLcvl9zzslpMGRAzlbuvmqX18Zyk1PUSppu81BTewkbAdng+cMQKcAyFCSnbkyaAmhzYtOL4jlgLXg+3Ck+XQKvKrFwzjaR5AzZTCanUv+6T3bv8BeVUb11yuVUJPPq2Nnk7F0pnK9zmGzKCuJMYu/OLXUKovcs64br+x6RSg7NUnpxfQGE+qt0zBtexc8cuY6E1CbJ0mTUJwVrblIhpuEcvoYGZKq71feSojWUbdqLPHRl5D22n1U7lp62nv06QdpyEtRZrfTYbdhJunLF9BQV6tsqJD7IOUdjXfcfruE1C9yMGdDN3Xq1DGclnCEsrws8nJyKNmzhOr5A2nSpfyAF53hTYrX5LV6lQw/2ZKcKgN+yIvagGnXvk7yM12JG3gFZas+UcJMVtK2ylLliqxqwwwFTuXWOeR+OZXsLesV75H5Ue5XMmurefrJARLQuMjBnA0tGvjE48q3oirIxaTXY1Tlo54VjXbVK4S1yeCtAFcJ2CSASFBtsBTLbUvaedCQ3eZFZ+Qifz3NNhV1MSOVmUxWzInPdqdg7hiM2fGY2rxH3QanaM0MEuZOpa4gV9n3KOE4zUblLkW5qVQIcU/kYP7VurFz505kJsVRXVqg3Osl2w273YEhcz+az5+mcnY05r1TaCzZS4spC1ylraHnLgN7Ydta8xnhdyo/yb4tMlkHjIT0OVQveo7Ul27gaL/LlKIxdXQvHLVqqr5egXrjDNSb55C19O8kzp+BWuZGh11ZzJN9Yn5mCoMGPC7hHIkczNlQN9movvX6a6QcO0hdRYmSBL02C35/AKdRhyF1DzXbplK9fDS1y0dgiB2P9dsZeLI2Eq6Jb5vaZRNbDs4SsBe1Vt0KnLYFN8WL5FqQC1fmZtQz+pI8uDvHojtw+GHZsX+ItTwX9cbPKFozk+S5U0hfE0N9WQkupwOrUUd1WSGL58/hlptulHAOnIurqaf0OyHE+i5dOtsHPBHNu2+9waxpU/hm93Zq1CqCwRChULNSAjSUZlGftJ3anTOoinmV6iVD0ca8jGnbezjiF+Ev+opmfTo4i1qBSXBuCat1JTFUn03d8uGUTO7Nscc7cuzxKOL7XYIpeRe1R7aR9vlHJC+aQ3n8UWVfpLK92KDl0L7d9H30EQmm6FxO75GSuyRGyZwkhNgj14jktzV6xHBi166mvCgfj9OpeJbL7cNubsBcWYLhxEHq9i+leu0EKhcPo2bpEOrXjcO6fxqejLU0lu4jVB2HN3cb9atepmZ+fzKG30Bi/w4kD+rM/t6/YvvjvTjw/l/J3b0dc201LpcTl7WBghNpyhcWFRUlN5vP+bn9+EA7IcR9QoiZQogc+YsKo4a/yKY1KyjMzlCujfvdLhr9ATzeRhwOJ9b6GhqK06hP2ELN9mlUrXyDqkVDqJw3kLIpD5E8+k42/CGKDbcJNvcULLteMPvajmx4+Xk0GanKxnOXzayE+sK5s7jpNzdIr/nu/3sD54+VvJ9Cfosnr7vmmma5j/lv74xX7r3ISklEW1mhFJry1m+v1694mcNmw6bV0FCUiuq7rRz69H22jBjChqFPsXrwAHZ/9DdSv96F2WbB6bApeyR3xq7n4QeVXfd5QohnIz/E+aI7hBAvCyEWCiHSunTu5L6rV0+GvTCYGZ9+wo7Y9cjmt6q8RKld3E4Hfn8jgVCQQCiAyWSgqDCXktICSgtz0FdVkJuezDt/fYOLLrpI7taQN7Wckyr5XEnmr+i22ypl/sq/vEsX9509bmdA9GO8PuYVZn82VQEnf4ZC1lzy7iD5gwKq/Gzlf211zWEhxJ2RJ79QJaH1FkKMafsBlH1yFurSpbPibS889wx/HTf21AaEDCHE05En+HeVvEFF9lAftP0a1VORB/yiX/Tz1X8Cld7Jr3OPRPYAAAAASUVORK5CYII=";

export function SummaryView({ app }: SummaryViewProps) {
  const {
    language,
    selectedGamePlan,
    setSelectedGamePlan,
    gameResultLimit,
    setGameResultLimit,
    customBoxes,
    setCustomBoxEditorId,
    setCustomBoxQuery,
    setRenameBoxIndex,
    gamePlannerRef,
    locale,
    t,
    displayName,
    displayForm,
    boxes,
    databaseChoiceByPlanId,
    plannedEntries,
    generationSummary,
    originSummary,
    availabilitySummary,
    gameRecommendations,
    gameMissingEntries,
    ownedCount,
    progress,
    locateEntryInBoxes,
    renamePlannedBox,
    createCustomBox,
    deleteCustomBox,
    boxBeingRenamed,
    homeChallengeProgress,
    pokemonNames,
  } = app;
  return (
<section className="summary-view" aria-labelledby="collection-summary-title">
              <header className="summary-hero">
                <div>
                  <p className="eyebrow teal">{t("your_collection")}</p>
                  <h2 id="collection-summary-title">{t("collection_summary")}</h2>
                </div>
                <div className="summary-ring" style={{ background: `conic-gradient(var(--teal) ${progress}%, rgba(85, 224, 192, .12) 0)` }}><span><strong>{progress}%</strong>{t("completion")}</span></div>
                <div className="summary-metrics">
                  <article><strong>{ownedCount.toLocaleString(locale)}</strong><span>{t("pokemon_registered")}</span></article>
                  <article><strong>{Math.max(0, plannedEntries.length - ownedCount).toLocaleString(locale)}</strong><span>{t("pokemon_missing")}</span></article>
                  <article><strong>{plannedEntries.length.toLocaleString(locale)}</strong><span>{t("summary_entries")}</span></article>
                </div>
              </header>

              <div className="summary-grid">
                <HomeChallengeSummary
                  language={language}
                  locale={locale}
                  progress={homeChallengeProgress}
                  pokemonNames={pokemonNames ?? {}}
                  formLabel={(dex, form) => app.displayForm({ dex, form } as Parameters<typeof app.displayForm>[0])}
                  sourceUrl="https://bulbapedia.bulbagarden.net/wiki/Challenge_(HOME)"
                />
                <section className="summary-panel">
                  <div className="summary-panel-heading"><span>{t("by_generation")}</span><b>{t("completion")}</b></div>
                  <div className="progress-list">{generationSummary.map((item) => <div className="progress-row" key={item.generation}>
                    <div><strong>{t("generation")} {item.generation}</strong><span>{item.registered.toLocaleString(locale)} / {item.total.toLocaleString(locale)}</span></div>
                    <div className="progress-bar" aria-label={`${item.progress}%`}><i style={{ width: `${item.progress}%` }} /></div><b>{item.progress}%</b>
                  </div>)}</div>
                </section>

                <section className="summary-panel">
                  <div className="summary-panel-heading"><span>{t("by_origin")}</span><b>{t("completion")}</b></div>
                  <div className="progress-list origin-progress-list">{originSummary.map((item) => {
                    const itemProgress = item.total ? Math.round((item.registered / item.total) * 100) : 0;
                    return <div className="progress-row" key={item.key}>
                      <div><strong>{originMarkIconUrl(item.key) ? <OriginMarkIcon mark={item.key} label={groupName(language, item.key)} className="summary-origin-icon" /> : item.key === "living-dex" ? t("normal_living_dex") : groupName(language, item.key)}</strong><span>{item.registered.toLocaleString(locale)} / {item.total.toLocaleString(locale)}</span></div>
                      <div className="progress-bar" aria-label={`${itemProgress}%`}><i style={{ width: `${itemProgress}%` }} /></div><b>{itemProgress}%</b>
                    </div>;
                  })}</div>
                </section>

                <section className="summary-panel availability-panel">
                  <div className="summary-panel-heading"><span>{t("availability_breakdown")}</span></div>
                  <div className="availability-summary">{availabilitySummary.map((item) => <article className={item.status} key={item.status}><span>{t(`availability_${item.status}`)}</span><strong>{item.registered.toLocaleString(locale)} / {item.total.toLocaleString(locale)}</strong></article>)}</div>
                </section>

                <section className="summary-panel game-recommendations">
                  <div className="summary-panel-heading"><span>{t("best_games_to_progress")}</span><b>{t("obtainable_missing_count")}</b></div>
                  {gameRecommendations.length ? <div className="game-recommendation-list">{gameRecommendations.map((game, index) => <button
                    className={game.id === selectedGamePlan ? "active" : ""}
                    key={game.id}
                    aria-label={`${t("open_game_planner")} ${t(`game_${game.id}`)}`}
                    onClick={() => {
                      setSelectedGamePlan(game.id);
                      setGameResultLimit(24);
                      window.requestAnimationFrame(() => gamePlannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                    }}
                  >
                    <span className="game-recommendation-rank">{index + 1}</span>
                    <strong>{t(`game_${game.id}`)}</strong>
                    <span><b>{game.count.toLocaleString(locale)}</b> {t("missing_obtainable")}</span>
                    <span aria-hidden="true">→</span>
                  </button>)}</div> : <p className="game-recommendation-empty">{t("no_game_recommendations")}</p>}
                </section>

                <section className="summary-panel game-planner" ref={gamePlannerRef} id="game-planner">
                  <div className="game-plan-header">
                    <div><p className="eyebrow teal">{t("game_planner")}</p><h3>{t("obtainable_missing")}</h3></div>
                    <div><span className="sr-only">{t("select_game")}</span><StyledSelect value={selectedGamePlan} options={GAME_PLANS.map((game) => ({ value: game.id, label: t(`game_${game.id}`) }))} onChange={(game) => { setSelectedGamePlan(game); setGameResultLimit(24); }} ariaLabel={t("select_game")} className="game-selector" /></div>
                  </div>
                  {gameMissingEntries.length ? <>
                    <div className="game-results">{gameMissingEntries.slice(0, gameResultLimit).map((located) => {
                      const { entry, box, slotIndex } = located;
                      const localizedName = displayName(entry);
                      const localizedForm = displayForm(entry);
                      const originMarkKey = entry.mark ?? entry.groupKey;
                      return <button className="game-result" key={`${selectedGamePlan}:${entry.planId}`} onClick={() => locateEntryInBoxes(located)}>
                        <span className="game-result-art">{pokemonArtworkUrl(entry) && <img src={pokemonArtworkUrl(entry) ?? ""} alt="" loading="lazy" />}</span>
                        <span className="game-result-meta"><strong>{localizedName}{localizedForm ? ` — ${localizedForm}` : ""}</strong><small>{entry.variant === "shiny" ? t("shiny") : t("normal")} · {t("box")} {String(box.globalIndex + 1).padStart(3, "0")} · {t("slot")} {String(slotIndex + 1).padStart(2, "0")}</small></span>
                        {originMarkIconUrl(originMarkKey) ? <OriginMarkIcon mark={originMarkKey} label={entry.groupLabel} className="game-result-origin" /> : <em>{entry.groupLabel}</em>}
                        <span aria-hidden="true">→</span>
                      </button>;
                    })}</div>
                    {gameMissingEntries.length > gameResultLimit && <button className="show-more" onClick={() => setGameResultLimit((value) => value + 24)}>{t("show_more")} · {(gameMissingEntries.length - gameResultLimit).toLocaleString(locale)} {t("remaining_results")}</button>}
                  </> : <div className="game-plan-empty"><span>✓</span><strong>{t("game_plan_complete")}</strong></div>}
                </section>

                <section className="summary-panel box-organizer">
                  <div className="summary-panel-heading"><span>{t("box_organizer")}</span></div>
                  <div className="box-rename-row">
                    <StyledSelect value={boxBeingRenamed?.globalIndex ?? -1} options={[{ value: -1, label: t("jump_to_box") }, ...boxes.map((box) => ({ value: box.globalIndex, label: `${String(box.globalIndex + 1).padStart(3, "0")} · ${box.label}` }))]} onChange={(value) => { if (value >= 0) setRenameBoxIndex(value); }} ariaLabel={t("rename_box")} className="rename-box-selector" />
                    <label><span>{t("box_name")}</span><input value={boxBeingRenamed?.label ?? ""} disabled={!boxBeingRenamed} maxLength={48} onChange={(event) => { if (boxBeingRenamed) renamePlannedBox(boxBeingRenamed, event.target.value); }} /></label>
                    <button disabled={!boxBeingRenamed} onClick={() => { if (boxBeingRenamed) renamePlannedBox(boxBeingRenamed, ""); }}>{t("restore_default_name")}</button>
                  </div>
                  <div className="custom-box-heading"><div><strong>{t("custom_boxes")}</strong><span>{t("choose_pokemon")}</span></div><button className="primary-action" onClick={createCustomBox}>＋ {t("new_custom_box")}</button></div>
                  {customBoxes.length ? <div className="custom-box-list">{customBoxes.map((box) => <article key={box.id}>
                    <div><strong>{box.name || t("custom_box")}</strong><span>{box.planIds.length.toLocaleString(locale)} / 30</span></div>
                    <span className="custom-box-preview">{Array.from({ length: 30 }, (_, index) => { const entry = databaseChoiceByPlanId.get(box.planIds[index]); const artworkUrl = entry ? pokemonArtworkUrl(entry) : null; return <i key={index}>{artworkUrl && <img src={artworkUrl} alt="" loading="lazy" />}</i>; })}</span>
                    <footer><button onClick={() => { setCustomBoxQuery(""); setCustomBoxEditorId(box.id); }}>{t("edit_custom_box")}</button><button className="danger" onClick={() => deleteCustomBox(box)}>{t("delete_custom_box")}</button></footer>
                  </article>)}</div> : <p className="custom-box-empty">{t("no_custom_boxes")}</p>}
                </section>

                <section className="summary-panel shortcut-guide">
                  <div className="summary-panel-heading"><span>{t("keyboard_shortcuts")}</span></div>
                  <div className="shortcut-grid"><span><kbd>← ↑ → ↓</kbd>{t("shortcut_arrows")}</span><span><kbd>Space</kbd>{t("shortcut_space")}</span><span><kbd>F</kbd>{t("shortcut_favorite")}</span><span><kbd>/</kbd>{t("shortcut_search")}</span><span><kbd>PgUp / PgDn</kbd>{t("shortcut_boxes")}</span><span><kbd>Ctrl / ⌘ + Z</kbd>{t("shortcut_undo")}</span></div>
                </section>
              </div>
              <style>{`.bread-support-link{display:flex;width:fit-content;align-items:center;gap:7px;margin:14px auto 0;padding:4px 10px 4px 5px;border:1px solid rgba(85,224,192,.16);border-radius:999px;background:rgba(8,31,28,.48);color:#a9bfbc;font-size:14px;font-weight:700;text-decoration:none;transition:border-color .16s ease,background .16s ease,color .16s ease,transform .16s ease}.bread-support-link img{width:30px;height:30px;object-fit:contain}.bread-support-link:hover{border-color:rgba(85,224,192,.34);background:rgba(35,114,99,.13);color:var(--teal);transform:translateY(-1px)}.bread-support-link:focus-visible{outline:2px solid var(--teal);outline-offset:3px}`}</style>
              <a className="bread-support-link" href="https://ko-fi.com/jacs26" target="_blank" rel="noreferrer noopener" aria-label="Buy me a bread on Ko-fi">
                <img src={BREAD_SUPPORT_ICON} alt="" />
                <span>Buy me a bread</span>
              </a>
            </section>
  );
}
