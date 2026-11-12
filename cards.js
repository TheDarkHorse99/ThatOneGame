// Card data for That One Game.
// Snapshot of the "Cards" Google Sheet taken 2026-11-12.
// Each line is: Name | type | traits | stats (R,Y,G,B; x = the card does not have that stat) | level | effect
// To change a card, edit its line here (or ask Claude to re-sync from the sheet).

const RAW = {
  'Basic': String.raw`
Tornado|event|Disaster||1|Return a Lv 2 or less card back to hand.
Meteor|event|Space||3|Send a unit or object controlled by each player to the discard pile
Ancient Redwoods|object|Flora||2|1) You have +1 Bonus Plays. 2) At the end of each of your turns, mill 3.
Fungal Growths|object|Flora||2|Once per turn, you may shuffle a unit from your discard pile into your deck, then draw a card.
Freshwater Snapper|unit|fish|2,2,2,2|1|
Dragon in the Cave|unit|Dragon|6,6,x,x|2|COST: Discard a card
Novice Wizard|unit|wizard|0,0,0,0|1|At the beginning of your turn, this gets +3 of your choice.
Rogue Robot|unit|robot|2,x,x,6|3|Play with the top card of your deck revealed.
Reanimated Dead|unit|undead|2,2,x,x|1|You may play this from your discard pile
Hungry|event|famine||1|Your opponent discards a card.
The Beach|location|sea||2|At the beginning of your turn, get +1 life.
Shoot|event|weapon||1|Deal 3 damage to your opponent.
Gun|object|weapon||2|At the beginning of your turn, you may add "Shoot" from your deck to your hand.
P.I.|unit|detective|x,3,x,2|2|When played, look at your opponent's hand.
Learned Experience|object|experience||1|Send this to the discard pile and add a Lv 1 unit to your hand.
Wisdom|object|experience||2|You may look at the top card of your deck anytime.
Epidemic|event|disease||3|Send all Level 3 cards to the discard pile
Voracious Yeti|unit|snow|10,5,x,x|3|
Object Removal|event|destruction||1|Send an opponent's object to the discard.
Trash Day|event|Destruction||1|Send a card with no effect to the discard pile.
Wild Fire|event|Disaster||3|Send a location to the discard pile
Leech|unit|Water|x,x,1,x|1|At the end of the turn, your opponent mills 2 cards.
Forcefield|object|Defense||1|When your opponent plays a lvl2 or lower unit, you may send this card to the discard, then return that unit back to hand.
Magic Reversal|event|Spell||2|(Quick): For the rest of this turn, any life your opponent would gain, you gain instead.
Gravedigger|unit|Worker|1,x,x,1|1|When played, both players shuffle their discard pile into their deck.
Color Theory|event|Theory||1|(Quick): For the rest of the turn, one of your units loses one of its colors, then gains a color it doesn't have of the same value.
Buckshot|event|Weapon||3|Discard a card then Deal 6 dmg to your opponent
Rip Soul|event|Spell||2|Take 3 dmg and Send all cards in a units soul to the discard pile.
Heater|object|Contraption||1|Equip to a unit: this unit cannot be frozen or get frostbite
Burn the Texts|event|Command||1|Remove the effect text of a unit your opponent controls until the end of turn.
Light Refractor|object|Contraption||1|Equip to a unit. When played choose a color. This unit gets that color with value 0.
Black Hole|object|Space||3|Discard your hand (min1). Put all cards on the field into this objects soul. Whenever an object or unit is played, send it to this cards soul.
Betrayal|event|Combat||2|Kill a unit with a color matching one of yours.
Hateful Rage|event|Combat||2|Kill a unit with a color not matching any of yours.
Poof!|event|Magic||2|Shuffle one of your opponent's level 2 or lower units back into their deck.
Silent Killer|unit|Villain|0,x,x,0|1|(Quick): When your opponent attacks with a Level 2 or lower unit, you may play this from hand blocking the attacking unit. At the end of that attack, kill the blocked unit.
Brownie of the Glade|unit|Fae|x,0,0,x|1|OPT: You may sacrifice this unit to send a Y or G level 1 unit your opponent controls to the discard pile.
Thievery|event|Villain||1|Send an object your opponent controls to the discard pile. You may discard a card, to then send another object controlled by your opponent to the discard pile.
`,
  'Dark Forest': String.raw`
The Dark Forest|location|Dark, Forest||1|1) You may Hide cards. (For your play per turn, place a card face down treating it as if it had no text except for Ambush.)\n2) When you Ambush, draw a card.
Twisted Wolf|unit|Dark Fauna|3,x,3,x|1|When an opposing unit attacks you, you may Ambush (Flip this card face up following normal lvl rules)
Decaying Viper|unit|Dark Fauna, poisonous|1,x,1,x|1|1) When your opponent plays a unit, you may Ambush and immediately attack it with this unit.\n2) When this unit attacks another unit, that unit becomes Poisoned (at the end of the turn it is killed.)
Gnarled Grizzly|unit|Dark Fauna|5,x,5,x|2|When an opposing unit deals damage to you, you may Ambush, this card gets +3RG until end of turn, and immediately attack with this unit.
Haunting Owl|unit|Dark Fauna|x,x,2,2|1|1) When this is played, if you control a Forest, draw a card.\n2) At the end of your opponent’s turn, you may Ambush, look at the top card of your deck, and place it on the top or the bottom.
Multiplying Rabbits|unit|Fauna|x,x,1,x|1|If you control a Forest, you have +1 Bonus Plays.
Alone in the Woods|event|Dark, Forest||1|Add a “The Dark Forest” from your deck to your hand.
Clamorous Woodpecker|unit|Fauna|0,x,3,x|1|If you control a Forest, you may draw a card at the beginning of your turn.
Wicked Trees|object|Dark Flora||2|When your unit Ambushes, it gets +4 of your choice until end of turn.
Rotting Leaves|object|Dark Flora||1|You have +1 Bonus Plays. It must be to Hide a unit.
Feasting Rabbits|unit|Dark Fauna|2,x,2,x|1|At the start of your turn you may Ambush, then play 2 "Feasting Rabbits" from your deck.
Sinister Fairy|unit|Dark Fauna, fairy|x,5,3,x|2|1) When an opposing unit attacks you, you may Ambush.\n2) This gets +1YG for each Hidden card you control.
Mutated Stag|unit|Dark Fauna|5,x,2,x|2|1) When your opponent would draw a card, you may Ambush.\n2) When your opponent draws a card, you may discard a card and draw a card.
Nocturnal Beasts|event|Dark||1|Flip all your Dark Fauna face down.
Moonlit Glade|location|Dark, Forest||1|Your Dark Fauna that have been Ambushed get +1RYGB.
Depraved Boar|unit|Dark Fauna|8,x,3,x|3|When your opponent plays a unit, you may Ambush, then send all opposing units with 3 or less R/G to the discard pile.
Scurrying Mouse|unit|Fauna|x,x,1,x|1|If you control a Forest you have +1 Bonus Plays.
Dread Mouse|unit|Dark Fauna|2,x,4,x|2|1) At the beginning of your turn, you may Ambush this card, then draw 1 card.\n2) At the end of turn you may discard a card, then Hide this card.
Deep Meadow Elk|unit|Fauna|x,1,4,x|2|If your other Fauna unit would die, you may sacrifice this unit instead.
Silverback|unit|Fauna|0,x,5,x|2|Gets +1R for each Dark Fauna you control.
The Forest's Curse|event|Dark||2|(Quick): Return all Fauna from your discard pile that died this turn, to the field hidden.
`,
  'Wonderland': String.raw`
Queen of Hearts|unit|Wonderland|5,4,x,x|2|When played, you may play 2 “Playing Card Guard” from your deck rested. They get Guard Duty (Can’t attack. When your opponent attacks, you may rest this unit to negate that attack).
Playing Card Guard|unit|Wonderland|2,2,2,2|1|
Tweedledee|unit|Wonderland|x,4,1,x|2|1) When played from hand, you may add “Tweedledum” from your deck to your hand.\n2) When this unit attacks another unit, if you control “Tweedledum”, this gets +2Y.
Tweedledum|unit|Wonderland|x,4,1,x|2|1) When played from hand, you may add “Tweedledee” from your deck to your hand.\n2) When this unit attacks another unit, if you control “Tweedledee”, the opposing unit gets -2Y.
Alice|unit|Wonderland|2,2,2,2|2|1) When played, you may play “Wonderland” from your deck.\n2) When one of your cards is put back into your deck, this gets +1 of your choice.
Wonderland|location|Wonderland||1|1) At the end of your turn you may shuffle a Wonderland card you control into your deck, then draw a card.\n2) You have +1 Bonus Plays.
Cheshire Cat|unit|Wonderland|x,1,x,1|1|When played, if you control "Wonderland", draw 1 card and you gain a Bonus Play this turn. At the end of your turn, put this card at the bottom of your deck.
Hatter|unit|Wonderland, mad|0,0,0,0|1|1) If it is Tea Time, this card gets +4RYGB.\n2) (Quick): You may sacrifice a “Time” you control, then Time Stands Still (No card can be removed from the field by card effects) until the end of the turn.
Tea Party|location|Wonderland||1|1) It is Tea Time.\n2) At the end of your turn, shuffle 1 card in your hand into your deck and draw 2 cards.
Time|object|Wonderland||1|If you control an “Alice”, you have +1 Bonus Plays.
Dormouse|unit|Wonderland, sleepy|x,x,1,x|1|If it is Tea Time, this card gets +4G.
White Rabbit|unit|Wonderland, late|x,x,2,4|1|COST: Sacrifice a “Time” you control.\nWhen played, shuffle up to 3 wonderland cards from your discard pile into your deck, then draw a card for each card shuffled into your deck.
Caterpillar|unit|Wonderland|x,3,x,3|1|If you control an “Alice”, you have +1 Bonus Plays.
Jabberwock|unit|Beast|0,x,x,0|3|COST: [Control "Wonderland"]\n1) When played reveal the top 5 cards of your deck, add the combined R and B stats to this card, then shuffle deck.\n2) When played choose one: Jaws that Bite (Send a unit to the discard pile) OR Claws that Catch (Gain control of an opposing unit with less R/B than this unit) OR Eyes of Flame (Opponent reveals their hand and you discard one card from it).
Vorpal Sword|object|Sword||3|COST: [Equip an "Alice" you control.]\nOnce per turn, you may Slay the Jabberwock (Send a "Jabberwock" you control to the discard pile, then the equipped "Alice" gets +RYGB equal to the sent unit's highest stat). The equipped Alice cannot be sent to the discard pile or killed.
Playing Card Soldier|unit|Wonderland|0,0,0,0|2|Gets +3 R if you control another unit with red. The same applies for Y, G, and B.
March Hare|unit|Wonderland|x,3,3,x|2|Can attack the turn it is played. At the end of your turn, return this card to your hand.
King of Hearts|unit|Wonderland|x,x,x,7|3|When one of your units leaves the field, shuffle it into your deck and draw 1.
`,
  'Contracts': String.raw`
Pact of the Crossroads|object|contract||1|1) At the beginning of your turn, lose 5 life\n2) At the beginning of your turn, draw 2 cards.
Deal with the Devil|object|contract||2|This card cannot be removed from the field\nWhen played, your opponent sends all but one card they control to the discard pile\nAt the end of the turn, if this is at least the third turn since this card was played, you lose the game
Bargain for your Life|object|contract||1|At the beginning of your turn, lose 5 life\nAnytime you would lose life, you must mill that many cards instead
Demon’s Covenant|object|contract||2|At the beginning of your turn, lose 5 life\nAll demons you control get +3R
Pact of the Summoned|object|contract||1|At the beginning of your turn, lose 5 life\nYou have +2 Bonus Plays.
Lucifer, Prolonged Punishment|unit|devil/fallen angel|6,6,x,6|3|You cannot lose by the effects of “Deal with the Devil”\nWhen played, play a contract and a Lv1 demon from your deck
Crossroads Demon|unit|demon|2,4,x,x|1|(Quick): When an opposing unit attacks, you may play this from your hand\nWhen this unit dies in combat, the unit that attacked is Condemned (When it leaves the field, remove it from play)
Gates to Gehenna|location|hell||1|At the end of each turn, gain 1 life for each contract you control\nOPT: You may play a demon or devil from your discard pile
Lucifer, the Morning Star|unit|devil/fallen angel|6,6,x,6|3|Units this unit kills in combat are Condemned\nWhen this unit kills another unit, it gets +1RYB\nThis unit can attack twice, if you lost 5 or more life this turn.
Loophole|event|||1|Send one of your contracts to the discard pile
Posessing Demon|unit|demon|1,1,x,x|1|When played, you may kill this unit to take control of an opposing lv1 unit.
Demon of the Reap|unit|demon|4,2,x,x|1|Units this unit kills are Condemned
Pain Giver|unit|demon|5,x,x,5|2|At the end of each of your turns, an opposing unit gets -2 of your choice, then if its stat is 0 because of this, kill it.
Offer Tribute|event|||2|Choose an opposing unit and your opponent chooses a demon you control, then those units die.
Throne of Gehenna|location|hell||3|Your units with "Lucifer" in the name cannot be killed by opponent's card effects.\nDuring your opponent's turn, not during combat, your opponent may discard all cards in their hand (min.1) to send your "Lucifer" to the discard pile.
Contract of the Damned|object|contract||1|At the beginning of your turn, lose 5 life.\nAt the end of your turn, you may kill one of your demons to kill one of your opponent's Lvl 2 or less units and it's Condemned.
Fiend of Gluttony|unit|Demon|4,4,x,x|2|When this unit kills another unit, it gets +2 R or Y
Fiend of Envy|unit|Demon|x,3,x,3|2|When this unit is played, if your opponent has more life then you, gain 5 life. If they have more cards in hand than you, draw 2.
Fiend of Lust|unit|Demon|2,5,x,x|2|Rest this unit: Your opponent and you each draw 1 and gain 3 life. You get +1 bonus play this turn.
`,
  'Ghost Tree': String.raw`
The Ghost Tree|location|Undead Flora||2|Action: OPT: You may play an Undead unit from your discard pile and it may attack this turn.\nAt the end of your turn it dies.
The Rascal Haunt|unit|Undead|x,1,1,x|1|When this card is drawn, you may put this card in your opponent's hand. Then, their next play must be this card.\nThis unit is always under its owner's control.
The Undying Ghoul|unit|Undead|x,1,5,x|2|This unit does not go to the discard pile the first time it is killed this turn.
Servant of the House|unit|Undead|x,x,2,2|1|When played from the discard pile, draw 1 and you gain 1 Bonus Play this turn.
Risen Vengeance|unit|Undead|0,5,5,0|2|When played from the discard pile, this gets +5RB.
The Unseen Phantom|unit|Undead|x,4,4,x|2|If this unit was played from the discard pile, it cannot be blocked.
Will-o'-the-wisp|unit|Undead|x,1,x,x|1|If you control "Ghost Tree", you draw an additional card.
Lively Graveyard|location|||1|You have +1 Bonus Plays. It must be an undead unit.
The Howling Wind|unit||x,2,5,x|2|All your Undead units get +2YG.
The Nefarious Haunt|unit|Undead|1,x,2,x|1|Sacrifice this unit and take control of one of your opponent's Lv2 or lower units until end of turn.
The Rotted Flesh|unit|Undead|x,1,1,x|1|When this unit dies, you may mill 5 cards, then draw 2 cards.
The Full Moon|event|||2|Kill all your units, then you may play 3 Lv2 or lower Undead from your discard pile
Master of the House|unit|Undead|x,8,8,x|3|Soulbond - "The Ghost Tree" (When either leaves play, the other goes to that same location).\nThis unit cannot be removed from play by card effects.
The Drowned Bride|unit|Undead|x,6,3,x|2|Soulbond - "The Ghost Tree".\n(Action): Once per turn, you may sacrifice an Undead to kill an opponent's unit of the same Lv.
Child of the House|unit|Undead|0,0,0,0|1|Soulbond - "The Ghost Tree".\n(Action): Once per turn, you may lose life equal to two times the level of a unit in your discard pile, to play that unit.\nIt may attack this turn and it dies at the end of turn.
Cursed Stump|event|||1|Mill 5 cards, then search your deck for "The Ghost Tree".
The Dark Fangs|unit|Undead|x,2,2,x|1|When this unit is played from the discard pile, it gets +xYG equal to the number of Undead in your discard pile with different names until end of turn.
The Pathwork Kid|unit|Undead|x,3,3,x|1|When this unit dies, give one of your Undead units +3YG.
Unhallowed Night|event|||3|(Discard a card): Kill all units on the field. Each player draws a card for each one of their undead units that died.
Ghastly Time Capsule|event|||1|Search your deck for an undead unit and send it to the discard pile.
Endless Screams|object|||3|At the end of each turn, all units that came into play that turn are killed. All units that come into play can attack the turn they enter.
`,
  'World Engine': String.raw`
The World Engine|location|||1|At the beginning of each turn, draw 1.\nYou have +1 Bonus Plays.\nAt the end of your turn, remove from play a card in your discard pile for each card you drew beyond the first and each additonal card you played from hand this turn. If you cannot, remove this card from play.
Genesis of the Engine|event|||1|COST: [Discard a card from hand]\nSearch your deck for "The World Engine" and put it into play.
The Ancient One|unit||0,0,0,0|1|When played, you may discard a card, then search your deck for "The World Engine" and put it into play.
Cleaner|unit|robot|0,0,0,0|1|When played if you control "The World Engine", search your deck for 2 cards and send them to the discard pile.
Energy Converter|unit|robot|0,0,0,0|1|Once per turn, when you draw a card if you control "The World Engine", you may discard a card and add a card from your discard pile to hand.
Salvage Refinery|unit|robot|0,0,0,0|1|At the beginning of your turn, return a card removed from play by "The World Engine" back to the discard pile.
Resource Extractor|unit|robot|0,0,0,0|1|If you control "The World Engine", draw 1 card at the beginning of your turn.
Assembly Machine|unit|robot|0,0,0,0|1|If you control "The World Engine", you have +1 Bonus Plays.
Firewall|unit|robot|0,0,0,0|2|When this unit blocks if you control "The World Engine", its RYGB becomes equal to the RYGB +1 of the attacking unit until end of that combat.
Malware|unit|robot|0,0,0,0|1|(Action): If you control "The World Engine", you may sacrifice this unit to change an opponent's unit's RYGB to 0.
Virus Ejection|event|||2|If you control "The World Engine", kill a unit.
Artificial Intelligence: Omicron|unit|AI|0,0,0,8|3|If you control "The World Engine", this unit immediately attacks the first unit your opponent plays each turn, then draw 1.
Artifical Intelligence: Epsilon|unit|AI|0,0,0,8|3|If you control "The World Engine", your opponent must attack your rested units if there are any.\nWhen your oppponent attacks, draw 1.
Artifical Intelligence: Sigma|unit|AI|0,0,0,10|3|This unit gets -5B if you do not control "The World Engine".\nAt the beginning of the turn, draw 1.
Traffic Swarm|unit|robot|0,0,0,0|2|(Action): If you control "The World Engine", you may rest this unit to mill the top 3 cards from opponent's deck.
Nitro Injection|object|||1|If you control "The World Engine", You may sacrifice this to draw a card and you gain +1 Bonus Plays this turn.
Data Flow Controller|unit|robot|0,0,0,0|2|(Action): If you control "The World Engine", you may rest this unit to make your opponent discard a card.
Accelerator|unit|robot|0,0,0,0|2|(Action): If you control "The World Engine", you may rest this unit to deal 2 damage to your opponent.
Recycler|object|||1|At the beginning of your turn, put one of your cards that was removed from play into your discard pile.
Stasis Machine|object|||3|When this enters, draw 2. You cannot lose from having 0 cards in your deck.
Calculated Failsafes|event|||2|(Quick): If a robot or Ai you control would die, remove from a play a card in your discard pile, and it doesn't die.
`,
};

export const slug = (name) => name.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const SETS = Object.keys(RAW);
export const CARDS = [];
for (const set of SETS) {
  for (const line of RAW[set].split('\n')) {
    if (!line.trim()) continue;
    const [name, type, traits, stats, level, effect] = line.split('|').map((x) => x.trim());
    CARDS.push({
      id: slug(name),
      name,
      type,
      traits,
      stats: stats ? stats.split(',').map((v) => (v.trim() === 'x' ? null : Number(v))) : null,
      level: Number(level),
      effect: (effect || '').replace(/\\n/g, '\n'),
      set,
    });
  }
}
export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// Starter decks for the first playtest. Format: [copies, card name].
const starter = (name, list) => ({
  id: 'starter-' + slug(name),
  name,
  starter: true,
  cards: Object.fromEntries(list.map(([n, card]) => [slug(card), n])),
});
export const STARTERS = [
  starter('Dark Forest (starter)', [
    [3, 'The Dark Forest'], [3, 'Alone in the Woods'], [3, 'Twisted Wolf'], [3, 'Decaying Viper'],
    [3, 'Haunting Owl'], [3, 'Feasting Rabbits'], [3, 'Multiplying Rabbits'], [2, 'Scurrying Mouse'],
    [3, 'Clamorous Woodpecker'], [2, 'Rotting Leaves'], [1, 'Nocturnal Beasts'],
    [2, 'Gnarled Grizzly'], [2, 'Mutated Stag'], [2, 'Dread Mouse'], [1, 'Sinister Fairy'], [2, 'Betrayal'],
    [2, 'Depraved Boar'],
  ]),
  starter('Contracts (starter)', [
    [3, 'Gates to Gehenna'], [3, 'Pact of the Crossroads'], [3, 'Pact of the Summoned'], [2, 'Contract of the Damned'],
    [3, 'Loophole'], [3, 'Crossroads Demon'], [3, 'Demon of the Reap'], [3, 'Posessing Demon'],
    [2, 'Pain Giver'], [2, 'Fiend of Gluttony'], [2, 'Fiend of Envy'], [2, 'Fiend of Lust'],
    [1, 'Demon’s Covenant'], [1, 'Deal with the Devil'], [1, 'Offer Tribute'], [2, 'Hateful Rage'],
    [2, 'Lucifer, Prolonged Punishment'], [2, 'Lucifer, the Morning Star'],
  ]),
];
