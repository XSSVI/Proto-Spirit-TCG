function SpiritWar() {
  return (
    <div className="px-8 py-10 max-w-5xl mx-auto text-gray-100 text-left">
      <h1 className="text-5xl font-bold text-indigo-400 mb-6">SPIRIT WAR</h1>
      <p className="text-2xl text-indigo-200 mb-10">
        The higher order calls for your help to fight with your allied spirits in a war for the fate of the world!
      </p>

      <section className="mb-10">
        <h2 className="text-3xl font-semibold text-indigo-300">How to Play</h2>
        <p className="mt-4 text-lg">
          Your Deck is your life. You win by emptying your opponent’s Deck before yours runs out. Use Spirits, Beyonders,
          and Evocations to inflict damage and send cards to the GRAVE. Each has a Soul Cost that must be paid from your COLLECTION (your Soul bank).
        </p>
        <ul className="list-disc ml-6 mt-4 space-y-2 text-lg">
          <li>Spirits and Beyonders have offensive (Edge) and defensive (Shield) stats.</li>
          <li>Evocations give powers: some are immediate (<strong>BLAST</strong>), others are ongoing (<strong>STASIS</strong>).</li>
          <li>Cards are played into zones on the ARENA — Spirit row, Evocation row, and more.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-indigo-300">Game Zones</h2>
        <p className="mt-4 text-lg">Key areas on the battlefield include:</p>
        <ul className="list-disc ml-6 mt-2 space-y-1 text-lg">
          <li><strong>ARENA:</strong> Where the action happens.</li>
          <li><strong>COLLECTION:</strong> Stores Souls used to pay for cards.</li>
          <li><strong>GRAVE:</strong> Cards go here when broken or used.</li>
          <li><strong>VOID:</strong> Only recoverable through specific abilities.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-indigo-300">Rules Summary</h2>
        <ul className="list-disc ml-6 space-y-2 text-lg mt-4">
          <li>You can control up to 3 Spirits/Beyonders and 3 Evocations on the field.</li>
          <li>Cards are summoned/emitted by turning Soul cards horizontally (exhausting them).</li>
          <li>Combat follows 3 stages: Declaration, Response, and Resolution.</li>
          <li>Only one Soul can be placed per turn in your COLLECTION from hand.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-indigo-300">Card Keywords</h2>
        <p className="mt-4 text-lg">Keywords describe abilities or limitations. Examples include:</p>
        <ul className="list-disc ml-6 mt-2 space-y-1 text-lg">
          <li><strong>Unbreakable:</strong> Cannot be broken by specified cards.</li>
          <li><strong>Assault:</strong> Can be played face-down and activated during opponent’s turn.</li>
          <li><strong>Chosen One:</strong> Only 1 copy allowed in all decks.</li>
          <li><strong>Undying:</strong> Can be played from GRAVE but goes to VOID if removed again.</li>
        </ul>
      </section>

      {/* PNG image section */}
      <div className="mt-16">
        <img src="/WarSpirit.PNG" alt="Spirit War Art" className="w-full max-w-xl mx-auto" />
      </div>
    </div>
  );
}

export default SpiritWar;
