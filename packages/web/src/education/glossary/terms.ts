import type { TopicId } from '../types';

export type GlossaryCategory = 'DNA' | 'Gene' | 'Translation' | 'Phage' | 'Evolution' | 'Analysis';
export type GlossaryId = TopicId | string;

export interface GlossaryTerm {
  id: GlossaryId;
  term: string;
  shortDef: string;
  longDef: string;
  category: GlossaryCategory;
  related?: GlossaryId[];
  seeAlso?: GlossaryId[];
}

const DNA_TERMS: GlossaryTerm[] = [
  {
    id: 'dna-sequence',
    term: 'DNA sequence',
    shortDef: 'String of A, T, G, C bases that encodes genetic information.',
    longDef:
      'Linear chain of nucleotides whose ordering carries hereditary instructions. Sequence context defines genes, regulatory signals, and structural motifs.',
    category: 'DNA',
    related: ['nucleotide', 'gene', 'reading-frame', 'gc-content'],
  },
  {
    id: 'nucleotide',
    term: 'Nucleotide',
    shortDef: 'Monomer unit of DNA or RNA consisting of base, sugar, and phosphate.',
    longDef:
      'Chemical building block with a nitrogenous base, deoxyribose or ribose sugar, and phosphate group. Polymerization of nucleotides forms nucleic acids.',
    category: 'DNA',
    related: ['dna-sequence', 'purine', 'pyrimidine', 'base-pair'],
  },
  {
    id: 'base-pair',
    term: 'Base pair',
    shortDef: 'Complementary pairing between nucleotides (A-T, G-C) in duplex DNA.',
    longDef:
      'Hydrogen-bonded pair of nucleotides that stabilizes the double helix. Watson–Crick pairs enforce complementarity and preserve sequence information.',
    category: 'DNA',
    related: ['complementarity', 'double-helix', 'purine', 'pyrimidine'],
  },
  {
    id: 'purine',
    term: 'Purine',
    shortDef: 'Adenine or guanine; two-ring bases in nucleic acids.',
    longDef:
      'Nitrogenous bases with fused double-ring structure. Pair with pyrimidines to maintain constant helix width (A with T/U, G with C).',
    category: 'DNA',
    related: ['pyrimidine', 'base-pair'],
  },
  {
    id: 'pyrimidine',
    term: 'Pyrimidine',
    shortDef: 'Cytosine, thymine, or uracil; single-ring bases in nucleic acids.',
    longDef:
      'Single-ring nitrogenous bases that pair with purines. Pairing rules (A-T/U, G-C) preserve geometry and support error checking during replication.',
    category: 'DNA',
    related: ['purine', 'base-pair'],
  },
  {
    id: 'sugar-phosphate-backbone',
    term: 'Sugar-phosphate backbone',
    shortDef: 'Alternating sugar and phosphate chain that forms DNA/RNA scaffold.',
    longDef:
      'Covalent linkage of deoxyribose sugars via phosphodiester bonds. Provides structural stability while bases face inward for pairing and information storage.',
    category: 'DNA',
    related: ['double-helix', 'antiparallel'],
  },
  {
    id: 'double-helix',
    term: 'Double helix',
    shortDef: 'Right-handed helical structure of duplex DNA strands.',
    longDef:
      'Picture a twisted ladder: the rungs are base pairs (A-T, G-C) and the rails are sugar-phosphate backbones. The two strands wind around each other in a right-handed spiral, creating major and minor grooves where proteins can "read" the sequence. This elegant structure lets DNA store information (in the base sequence), replicate faithfully (each strand templates the other), and be accessed by cellular machinery (through groove binding).',
    category: 'DNA',
    related: ['antiparallel', 'major-groove', 'minor-groove'],
  },
  {
    id: 'antiparallel',
    term: 'Antiparallel',
    shortDef: 'Opposite 5′→3′ orientation of strands in double-stranded DNA.',
    longDef:
      'One strand runs 5′ to 3′ while the complementary strand runs 3′ to 5′, enabling proper base pairing and polymerase directionality during replication.',
    category: 'DNA',
    related: ['double-helix', 'leading-strand', 'lagging-strand'],
  },
  {
    id: 'complementarity',
    term: 'Complementarity',
    shortDef: 'Specific pairing rules between nucleotides (A↔T, G↔C).',
    longDef:
      'Chemical matching between bases that allows one strand to predict the other. Drives replication fidelity, PCR primer design, and probe hybridization.',
    category: 'DNA',
    related: ['base-pair', 'double-helix', 'gc-content'],
  },
  {
    id: 'major-groove',
    term: 'Major groove',
    shortDef: 'Wider groove of the DNA helix where proteins often read sequence.',
    longDef:
      'Exposed surface on duplex DNA that presents accessible hydrogen-bond donors/acceptors, enabling sequence-specific binding by transcription factors.',
    category: 'DNA',
    related: ['minor-groove', 'double-helix', 'regulatory-motif'],
  },
  {
    id: 'minor-groove',
    term: 'Minor groove',
    shortDef: 'Narrow groove of the DNA helix with limited sequence readout.',
    longDef:
      'Secondary groove that influences hydration and drug binding. Some proteins and antibiotics target the minor groove for structural recognition.',
    category: 'DNA',
    related: ['major-groove', 'double-helix'],
  },
  {
    id: 'replication-origin',
    term: 'Replication origin',
    shortDef: 'Defined locus where DNA replication initiates.',
    longDef:
      'Sequence features and binding sites that recruit helicase and polymerase complexes to start bidirectional DNA synthesis.',
    category: 'DNA',
    related: ['replication-fork', 'leading-strand', 'lagging-strand'],
  },
  {
    id: 'replication-fork',
    term: 'Replication fork',
    shortDef: 'Y-shaped region where DNA strands are unwound and copied.',
    longDef:
      'Think of it as a zipper being opened: helicase unzips the double helix, and two DNA polymerases follow behind, each copying one strand. The "Y" shape forms because the strands separate at the fork and get copied in the wake. In bacteria and phages, forks can move at ~1,000 bases per second—a full E. coli genome in ~40 minutes.',
    category: 'DNA',
    related: ['leading-strand', 'lagging-strand', 'okazaki-fragment'],
  },
  {
    id: 'leading-strand',
    term: 'Leading strand',
    shortDef: 'Continuously synthesized DNA strand oriented 5′→3′ toward fork.',
    longDef:
      'The "easy" strand: polymerase can simply follow the helicase, synthesizing DNA continuously in one smooth run. It\'s like writing a sentence from left to right—you just keep going. Named "leading" because it\'s synthesized in the direction the fork is moving.',
    category: 'DNA',
    related: ['lagging-strand', 'replication-fork'],
  },
  {
    id: 'lagging-strand',
    term: 'Lagging strand',
    shortDef: 'Discontinuously synthesized strand built in Okazaki fragments.',
    longDef:
      'The "awkward" strand: because DNA polymerase can only work 5′→3′, this strand must be built backward relative to fork movement. Imagine writing a sentence where you can only write left-to-right, but the paper is moving right-to-left—you have to keep starting new words and stitching them together. These short pieces (Okazaki fragments) get joined by ligase into a continuous strand.',
    category: 'DNA',
    related: ['okazaki-fragment', 'leading-strand', 'replication-fork'],
  },
  {
    id: 'okazaki-fragment',
    term: 'Okazaki fragment',
    shortDef: 'Short DNA segment synthesized on the lagging strand.',
    longDef:
      'Primase lays RNA primers repeatedly; polymerase extends each fragment, and ligase later seals nicks to form a continuous lagging strand.',
    category: 'DNA',
    related: ['lagging-strand', 'replication-fork'],
  },
  {
    id: 'supercoiling',
    term: 'Supercoiling',
    shortDef: 'Overwinding or underwinding of DNA that compacts the genome.',
    longDef:
      'Think of a phone cord or rubber band that\'s been twisted: if you twist it enough, it coils up on itself. DNA does the same thing. Negative supercoiling (underwinding) helps open the helix for replication and transcription. Positive supercoiling (overwinding) builds up ahead of replication forks. Phages exploit supercoiling—their packaging motors generate enormous pressure by cramming DNA into capsids, creating tightly wound genomes.',
    category: 'DNA',
    related: ['topoisomerase', 'packaging-motor'],
  },
  {
    id: 'topoisomerase',
    term: 'Topoisomerase',
    shortDef: 'Enzyme that cuts and rejoins DNA to relax or introduce supercoils.',
    longDef:
      'The cell\'s "swivel" for managing DNA tangles. These enzymes cut DNA strands, pass other DNA through the break, then reseal it—all without losing genetic information. Type I topoisomerases cut one strand; Type II cut both. Without them, replication would wind DNA so tight it couldn\'t proceed. Many antibiotics (quinolones) and anticancer drugs target topoisomerases.',
    category: 'DNA',
    related: ['supercoiling', 'replication-fork'],
  },
  {
    id: 'melting-temperature',
    term: 'Melting temperature (Tm)',
    shortDef: 'Temperature where half of DNA duplex becomes single-stranded.',
    longDef:
      'The "breaking point" of the double helix. Heat a DNA solution and at some temperature the strands separate (denature). GC-rich DNA melts at higher temperatures because G-C pairs have three hydrogen bonds versus two for A-T. This matters for PCR primer design (primers should have similar Tm) and explains why GC content affects genome stability.',
    category: 'DNA',
    related: ['gc-content', 'denaturation'],
  },
  {
    id: 'denaturation',
    term: 'Denaturation',
    shortDef: 'Separation of DNA strands by heat or chemical conditions.',
    longDef:
      'Disrupts hydrogen bonds without breaking covalent backbone. Reversible upon cooling (renaturation) if complementary strands are present.',
    category: 'DNA',
    related: ['melting-temperature', 'complementarity'],
  },
];

const GENE_TERMS: GlossaryTerm[] = [
  {
    id: 'gene',
    term: 'Gene',
    shortDef: 'DNA segment that encodes a functional product (protein or RNA).',
    longDef:
      'Contiguous region that is transcribed and often translated. Includes regulatory elements like promoters and ribosome binding sites that control expression.',
    category: 'Gene',
    related: ['promoter', 'open-reading-frame', 'coding-sequence'],
  },
  {
    id: 'coding-sequence',
    term: 'Coding sequence (CDS)',
    shortDef: 'Portion of a gene that is translated into amino acids.',
    longDef:
      'The "recipe" for a protein, written in DNA. It starts at a start codon (usually ATG), continues in triplets (codons), and ends at a stop codon. Everything between is translated into a chain of amino acids. In annotation files, CDS coordinates tell you exactly where the protein-coding part begins and ends—essential for understanding what a phage gene actually makes.',
    category: 'Gene',
    related: ['open-reading-frame', 'start-codon', 'stop-codon'],
  },
  {
    id: 'open-reading-frame',
    term: 'Open reading frame (ORF)',
    shortDef: 'Stretch of nucleotides with start, in-frame codons, and stop.',
    longDef:
      'A "potential gene"—any stretch of DNA that could theoretically encode a protein (start codon → no internal stops → stop codon). Finding ORFs is like finding grammatically valid sentences in a string of letters. Not every ORF is a real gene, but every real gene is an ORF. Long ORFs are usually real; short ones might be chance. Comparing ORFs across phages helps distinguish true genes from noise.',
    category: 'Gene',
    related: ['coding-sequence', 'reading-frame', 'start-codon'],
  },
  {
    id: 'start-codon',
    term: 'Start codon',
    shortDef: 'Codon (often AUG/ATG) that signals translation initiation.',
    longDef:
      'Defines reading frame for a protein. In bacteria and phages, alternative starts (GTG, TTG) occur with lower efficiency.',
    category: 'Gene',
    related: ['open-reading-frame', 'translation-initiation', 'rbs'],
  },
  {
    id: 'stop-codon',
    term: 'Stop codon',
    shortDef: 'Codon (UAA, UAG, UGA) that terminates translation.',
    longDef:
      'Signals release factors to hydrolyze the final peptide from tRNA, ending elongation and freeing the ribosome.',
    category: 'Gene',
    related: ['open-reading-frame', 'translation-termination'],
  },
  {
    id: 'promoter',
    term: 'Promoter',
    shortDef: 'DNA motif that recruits RNA polymerase to start transcription.',
    longDef:
      'The "landing pad" for RNA polymerase—a DNA sequence that says "start transcribing here." Strong promoters attract polymerase frequently (high expression); weak promoters rarely (low expression). In bacteria, promoters typically have -10 and -35 boxes recognized by sigma factors. Phages often bring their own promoters or even their own polymerases (like T7) to hijack transcription.',
    category: 'Gene',
    related: ['transcription-start-site', 'regulatory-motif', 'sigma-factor'],
  },
  {
    id: 'operator',
    term: 'Operator',
    shortDef: 'Regulatory DNA site bound by repressors or activators.',
    longDef:
      'The "traffic light" controlling gene expression. When a repressor protein binds the operator, it blocks RNA polymerase from reading the gene (red light). When the repressor releases, transcription proceeds (green light). Lambda phage\'s famous cI/Cro switch works by having two proteins compete for overlapping operators—whoever wins controls the phage\'s fate.',
    category: 'Gene',
    related: ['promoter', 'transcription-factor'],
  },
  {
    id: 'transcription-start-site',
    term: 'Transcription start site (TSS)',
    shortDef: 'Exact nucleotide where RNA polymerase begins RNA synthesis.',
    longDef:
      'Defines +1 position of a transcript. Upstream promoter elements and sigma factors guide polymerase to this site.',
    category: 'Gene',
    related: ['promoter', 'transcript'],
  },
  {
    id: 'transcription-terminator',
    term: 'Transcription terminator',
    shortDef: 'Sequence that causes RNA polymerase to stop and release RNA.',
    longDef:
      'Includes intrinsic hairpin-forming terminators or factor-dependent sites (e.g., Rho). Prevents read-through into downstream genes.',
    category: 'Gene',
    related: ['transcript', 'operon'],
  },
  {
    id: 'ribosome-binding-site',
    term: 'Ribosome binding site (RBS)',
    shortDef: 'Motif upstream of start codon that aligns ribosome for initiation.',
    longDef:
      'The "welcome mat" for ribosomes—a sequence that says "start translating here." The ribosome recognizes this site, positions itself correctly over the start codon, and begins making protein. A strong RBS means lots of protein; a weak RBS means little protein. This gives cells (and phages) fine-grained control over how much of each protein to make, even from the same mRNA.',
    category: 'Gene',
    related: ['start-codon', 'translation-initiation', 'shine-dalgarno-sequence'],
  },
  {
    id: 'shine-dalgarno-sequence',
    term: 'Shine–Dalgarno sequence',
    shortDef: 'Purine-rich RBS motif that pairs with 16S rRNA anti-SD site.',
    longDef:
      'The specific "handshake" between mRNA and ribosome in bacteria. This AGGAGG-like sequence base-pairs with a complementary region in the 16S ribosomal RNA, physically pulling the ribosome into position. The spacing between Shine–Dalgarno and start codon matters—too close or too far and translation efficiency drops. Named for the scientists who discovered it in 1974.',
    category: 'Gene',
    related: ['ribosome-binding-site', 'translation-initiation'],
  },
  {
    id: 'operon',
    term: 'Operon',
    shortDef: 'Cluster of genes transcribed as a single polycistronic mRNA.',
    longDef:
      'A "gene neighborhood" where related genes are transcribed together as one long mRNA. This lets the cell coordinate expression—if you need enzyme A, you probably need enzymes B and C too. Phage lysis cassettes are classic operons: holin, endolysin, and spanin genes sit together and get expressed together at the right moment to burst the cell.',
    category: 'Gene',
    related: ['transcript', 'promoter', 'transcription-terminator'],
  },
  {
    id: 'intergenic-region',
    term: 'Intergenic region',
    shortDef: 'DNA segment between genes that can host regulatory motifs.',
    longDef:
      'Often contains promoters, operators, or small RNAs controlling adjacent genes. In compact phage genomes, intergenic space is minimal.',
    category: 'Gene',
    related: ['regulatory-motif', 'transcription-factor'],
  },
  {
    id: 'locus-tag',
    term: 'Locus tag',
    shortDef: 'Stable identifier assigned to an annotated gene.',
    longDef:
      'Unique label used in databases to track gene models across versions and assemblies, even if names change.',
    category: 'Gene',
    related: ['gene', 'coding-sequence'],
  },
  {
    id: 'regulatory-motif',
    term: 'Regulatory motif',
    shortDef: 'Short conserved sequence recognized by DNA-binding proteins.',
    longDef:
      'Includes promoters, operators, riboswitches, and binding sites that control transcription or translation efficiency.',
    category: 'Gene',
    related: ['promoter', 'operator', 'transcription-factor'],
  },
  {
    id: 'transcription-factor',
    term: 'Transcription factor',
    shortDef: 'Protein that binds DNA to modulate transcription.',
    longDef:
      'Acts as activator or repressor by recruiting or blocking RNA polymerase. Often responds to environmental signals or host state.',
    category: 'Gene',
    related: ['operator', 'promoter'],
  },
  {
    id: 'sigma-factor',
    term: 'Sigma factor',
    shortDef: 'Bacterial initiation factor that directs polymerase to promoters.',
    longDef:
      'Confers promoter specificity by recognizing -10/-35 elements, then dissociates after transcription initiates.',
    category: 'Gene',
    related: ['promoter', 'transcription-start-site'],
  },
  {
    id: 'transcript',
    term: 'Transcript',
    shortDef: 'RNA molecule produced by transcription of a DNA template.',
    longDef:
      'Includes mRNA, tRNA, or non-coding RNAs. In phages, transcripts can be temporal (early, middle, late) to stage gene expression.',
    category: 'Gene',
    related: ['messenger-rna', 'transcription-terminator'],
  },
  {
    id: 'attenuation',
    term: 'Attenuation',
    shortDef: 'Regulatory mechanism where transcription stops in response to translation status.',
    longDef:
      'Leader peptides and RNA structures sense charged tRNA levels, coupling transcription and translation to fine-tune downstream gene expression.',
    category: 'Gene',
    related: ['transcript', 'ribosome-binding-site'],
  },
  {
    id: 'antisense-rna',
    term: 'Antisense RNA',
    shortDef: 'RNA complementary to a transcript that modulates its stability or translation.',
    longDef:
      'Binds target mRNA to block ribosome access or trigger degradation. Phages use antisense RNAs for temporal control of gene expression.',
    category: 'Gene',
    related: ['transcript', 'messenger-rna'],
  },
];

const TRANSLATION_TERMS: GlossaryTerm[] = [
  {
    id: 'messenger-rna',
    term: 'Messenger RNA (mRNA)',
    shortDef: 'Transcript that carries coding information to the ribosome.',
    longDef:
      'Serves as the template for protein synthesis. Contains codons, untranslated regions, and often a ribosome binding site.',
    category: 'Translation',
    related: ['ribosome-binding-site', 'translation-initiation'],
  },
  {
    id: 'transfer-rna',
    term: 'Transfer RNA (tRNA)',
    shortDef: 'Adapter molecule that brings amino acids to the ribosome.',
    longDef:
      'Has anticodon loop to read codons and an acceptor stem charged with a specific amino acid by aminoacyl-tRNA synthetases.',
    category: 'Translation',
    related: ['anticodon', 'codon', 'amino-acid'],
  },
  {
    id: 'ribosomal-rna',
    term: 'Ribosomal RNA (rRNA)',
    shortDef: 'Catalytic and structural RNA within the ribosome.',
    longDef:
      'Forms the peptidyl transferase center and decoding sites. 16S rRNA also base-pairs with Shine–Dalgarno motifs to align start codons.',
    category: 'Translation',
    related: ['ribosome', 'shine-dalgarno-sequence'],
  },
  {
    id: 'ribosome',
    term: 'Ribosome',
    shortDef: 'Ribonucleoprotein machine that synthesizes proteins.',
    longDef:
      'The cell\'s "protein factory"—a molecular machine that reads mRNA and assembles amino acids into proteins. Made of RNA and protein, it has two subunits that clamp together on mRNA like a clamp. Ribosomes are ancient, essential, and surprisingly similar across all life. A single E. coli cell has ~20,000 ribosomes; during phage infection, most get hijacked to make viral proteins at a rate of ~20 amino acids per second.',
    category: 'Translation',
    related: ['peptide-bond', 'translation-initiation', 'translation-elongation'],
  },
  {
    id: 'anticodon',
    term: 'Anticodon',
    shortDef: 'Three-base sequence on tRNA complementary to an mRNA codon.',
    longDef:
      'Pairs with codons during translation to ensure the correct amino acid is added to the growing polypeptide chain.',
    category: 'Translation',
    related: ['codon', 'transfer-rna'],
  },
  {
    id: 'codon',
    term: 'Codon',
    shortDef: 'Three-base word in mRNA that specifies one amino acid or stop.',
    longDef:
      'The fundamental "word" of the genetic code. Just as English uses 26 letters to make words, biology uses 4 nucleotides in groups of 3 (codons) to specify 20 amino acids plus stop signals. With 4³ = 64 possible codons mapping to ~21 meanings, the code is redundant—multiple codons can specify the same amino acid (e.g., GGU, GGC, GGA, GGG all code for glycine). This redundancy buffers against mutation damage.',
    category: 'Translation',
    related: ['anticodon', 'reading-frame', 'amino-acid'],
  },
  {
    id: 'reading-frame',
    term: 'Reading frame',
    shortDef: 'Partition of a nucleotide sequence into non-overlapping codons.',
    longDef:
      'Imagine the sequence ATGCATGCA. Reading it as ATG-CAT-GCA gives one protein. Shift by one: TGC-ATG-CA gives a completely different protein. Shift again: GCA-TGC-A—different again. These are the three "reading frames." DNA has six total frames (three per strand). Getting the frame right is essential—wrong frame means gibberish protein. This is why start codons matter: they set the frame.',
    category: 'Translation',
    related: ['codon', 'frameshift', 'open-reading-frame'],
  },
  {
    id: 'frameshift',
    term: 'Frameshift',
    shortDef: 'Insertion or deletion that alters the reading frame of translation.',
    longDef:
      'The "off by one" catastrophe. Insert or delete a single base and every codon downstream gets misread—like removing one letter from "THE CAT ATE" to get "TH ECA TAT E..." Usually fatal to the protein. But some phages use programmed frameshifts cleverly: a ribosome slips at a specific slippery sequence, producing two different proteins from one gene at controlled ratios.',
    category: 'Translation',
    related: ['reading-frame', 'codon', 'stop-codon'],
  },
  {
    id: 'peptide-bond',
    term: 'Peptide bond',
    shortDef: 'Covalent link between amino acids formed during translation.',
    longDef:
      'Catalyzed by the ribosome’s peptidyl transferase center, joining amino acids into a growing polypeptide chain.',
    category: 'Translation',
    related: ['polypeptide-chain', 'ribosome'],
  },
  {
    id: 'polypeptide-chain',
    term: 'Polypeptide chain',
    shortDef: 'Linear chain of amino acids produced by the ribosome.',
    longDef:
      'Folds into secondary and tertiary structures to become a functional protein, sometimes assisted by chaperones.',
    category: 'Translation',
    related: ['peptide-bond', 'protein-folding'],
  },
  {
    id: 'translation-initiation',
    term: 'Translation initiation',
    shortDef: 'Assembly of ribosomal subunits at the start codon.',
    longDef:
      'Requires initiation factors, an initiator tRNA, and alignment via the RBS. Defines the reading frame for downstream elongation.',
    category: 'Translation',
    related: ['start-codon', 'ribosome-binding-site', 'initiation-factor'],
  },
  {
    id: 'initiation-factor',
    term: 'Initiation factor',
    shortDef: 'Protein that assists ribosome assembly on mRNA.',
    longDef:
      'Stabilizes initiation complex, prevents premature subunit joining, and positions initiator tRNA. Different sets exist for bacteria and eukaryotes.',
    category: 'Translation',
    related: ['translation-initiation', 'ribosome'],
  },
  {
    id: 'translation-elongation',
    term: 'Translation elongation',
    shortDef: 'Repeated addition of amino acids to the growing chain.',
    longDef:
      'Cycles of tRNA selection, peptide bond formation, and translocation. Elongation factors improve speed and fidelity.',
    category: 'Translation',
    related: ['elongation-factor', 'peptide-bond'],
  },
  {
    id: 'elongation-factor',
    term: 'Elongation factor',
    shortDef: 'GTPase proteins that drive tRNA delivery and ribosome movement.',
    longDef:
      'Ensure correct tRNA selection (EF-Tu/EF1A) and promote translocation (EF-G/EF2), coupling energy use to translation accuracy.',
    category: 'Translation',
    related: ['translation-elongation', 'ribosome'],
  },
  {
    id: 'translation-termination',
    term: 'Translation termination',
    shortDef: 'Process that ends protein synthesis at stop codons.',
    longDef:
      'Release factors recognize stop codons, promote hydrolysis of the peptidyl-tRNA bond, and dissociate the ribosome.',
    category: 'Translation',
    related: ['stop-codon', 'release-factor'],
  },
  {
    id: 'release-factor',
    term: 'Release factor',
    shortDef: 'Protein that recognizes stop codons to end translation.',
    longDef:
      'Binds the A site of the ribosome when a stop codon appears, triggering peptide release and ribosome recycling.',
    category: 'Translation',
    related: ['translation-termination', 'stop-codon'],
  },
  {
    id: 'wobble-base',
    term: 'Wobble base pairing',
    shortDef: 'Flexible pairing at the third codon position.',
    longDef:
      'A clever efficiency hack: the third position of a codon can "wobble" and still pair correctly with tRNA. G can pair with U, I (inosine) can pair with U, C, or A. This means one tRNA can serve multiple codons—cells don\'t need 61 different tRNAs. It\'s why the third codon position is often called "degenerate" and why synonymous mutations there usually don\'t matter.',
    category: 'Translation',
    related: ['anticodon', 'codon-bias'],
  },
  {
    id: 'codon-bias',
    term: 'Codon usage bias',
    shortDef: 'Preference for specific synonymous codons in a genome.',
    longDef:
      'Not all synonymous codons are created equal. Highly expressed genes tend to use "optimal" codons that match abundant tRNAs—translation is faster and more accurate. Rare codons can slow translation or cause errors. Phages often adapt their codon usage to match their host\'s tRNA pool, and unusual codon bias can be a fingerprint of horizontal gene transfer or recent host jumps.',
    category: 'Translation',
    related: ['wobble-base', 'transfer-rna', 'gc-content'],
  },
  {
    id: 'chaperone',
    term: 'Chaperone',
    shortDef: 'Protein that assists proper folding of other proteins.',
    longDef:
      'Prevents aggregation of nascent chains and helps refold stress-denatured proteins, improving yield of functional phage proteins.',
    category: 'Translation',
    related: ['protein-folding', 'polypeptide-chain'],
  },
  {
    id: 'protein-folding',
    term: 'Protein folding',
    shortDef: 'Process by which a polypeptide adopts its functional structure.',
    longDef:
      'Driven by amino acid chemistry and cellular environment; can involve chaperones and post-translational modifications.',
    category: 'Translation',
    related: ['chaperone', 'polypeptide-chain'],
  },
];

const PHAGE_TERMS: GlossaryTerm[] = [
  {
    id: 'phage-genome',
    term: 'Phage genome',
    shortDef: 'Complete genetic material of a bacteriophage.',
    longDef:
      'Can be DNA or RNA, double- or single-stranded, often compact and modular with mosaic gene blocks from recombination and horizontal transfer.',
    category: 'Phage',
    related: ['lysogeny', 'lytic-cycle', 'horizontal-gene-transfer'],
  },
  {
    id: 'virion',
    term: 'Virion',
    shortDef: 'Complete phage particle outside the host cell.',
    longDef:
      'Includes the capsid, tail, and packaged genome. Designed for stability, host recognition, and efficient genome delivery.',
    category: 'Phage',
    related: ['capsid', 'tail', 'phage-genome'],
  },
  {
    id: 'capsid',
    term: 'Capsid',
    shortDef: 'Protein shell that encloses the phage genome.',
    longDef:
      'The phage\'s "armored container"—a protective protein shell, usually icosahedral (20-sided), built from many copies of one or a few proteins. It\'s an engineering marvel: strong enough to withstand the enormous internal pressure of tightly packed DNA (atmospheres!), yet able to open and release the genome on cue. Size ranges from tiny (MS2 at 27 nm) to giant (jumbo phages at 200+ nm).',
    category: 'Phage',
    related: ['portal-protein', 'tail', 'virion'],
  },
  {
    id: 'portal-protein',
    term: 'Portal protein',
    shortDef: 'Gate-like capsid protein where DNA enters and exits.',
    longDef:
      'The "door" of the capsid—a ring of 12 identical proteins forming a channel at one vertex. During assembly, the packaging motor threads DNA in through the portal. During infection, DNA shoots out through the same channel into the host. The portal also anchors the tail and acts as a pressure valve, keeping the genome contained until the right moment.',
    category: 'Phage',
    related: ['packaging-motor', 'capsid'],
  },
  {
    id: 'tail',
    term: 'Tail',
    shortDef: 'Phage appendage that delivers the genome into the host.',
    longDef:
      'The phage\'s "syringe"—a sophisticated injection machine. Tails come in three main types: long contractile (myoviruses like T4), long non-contractile (siphoviruses like Lambda), and short (podoviruses like T7). Contractile tails work like a spring-loaded needle: the sheath contracts, driving the inner tube through the cell envelope. All tails must solve the same problem: getting DNA across one or more bacterial membranes.',
    category: 'Phage',
    related: ['tail-sheath', 'tail-fiber', 'injection'],
  },
  {
    id: 'tail-sheath',
    term: 'Tail sheath',
    shortDef: 'Contractile outer layer of some phage tails.',
    longDef:
      'Contracts to drive the tail tube through the bacterial envelope, creating a channel for genome delivery.',
    category: 'Phage',
    related: ['tail', 'tail-tube', 'injection'],
  },
  {
    id: 'tail-tube',
    term: 'Tail tube',
    shortDef: 'Inner channel of the phage tail through which DNA passes.',
    longDef:
      'Rigid tube that pierces the host cell envelope after sheath contraction or baseplate rearrangement.',
    category: 'Phage',
    related: ['tail', 'injection'],
  },
  {
    id: 'baseplate',
    term: 'Baseplate',
    shortDef: 'Tail structure that anchors fibers and triggers injection.',
    longDef:
      'Senses correct host receptor binding via attached fibers and undergoes conformational changes to initiate sheath contraction.',
    category: 'Phage',
    related: ['tail-fiber', 'injection', 'tail'],
  },
  {
    id: 'tail-fiber',
    term: 'Tail fiber',
    shortDef: 'Receptor-binding appendage used for host recognition.',
    longDef:
      'Determines host range by recognizing specific surface molecules. Often modular and can swap to retarget phage tropism.',
    category: 'Phage',
    related: ['receptor-binding-protein', 'host-range'],
  },
  {
    id: 'receptor-binding-protein',
    term: 'Receptor binding protein',
    shortDef: 'Protein domain that recognizes host surface receptors.',
    longDef:
      'Located on fibers or spikes; triggers downstream steps like baseplate rearrangement or sheath contraction upon binding.',
    category: 'Phage',
    related: ['tail-fiber', 'adsorption'],
  },
  {
    id: 'adsorption',
    term: 'Adsorption',
    shortDef: 'Initial attachment of a phage to the host cell surface.',
    longDef:
      'The first step of infection—the phage "landing" on its target. Tail fibers or spikes recognize specific molecules on the bacterial surface (LPS, porins, pili, teichoic acids). This is highly specific: the phage is essentially asking "is this my host?" Wrong receptor = no binding = no infection. Adsorption is often the rate-limiting step in infection dynamics and a major determinant of host range. Bacteria can evolve resistance by modifying or hiding their receptors.',
    category: 'Phage',
    related: ['receptor-binding-protein', 'injection'],
  },
  {
    id: 'injection',
    term: 'Genome injection',
    shortDef: 'Delivery of phage nucleic acid into the host cell.',
    longDef:
      'Tail contraction or channel formation drives the genome across the cell envelope, often aided by pilot proteins.',
    category: 'Phage',
    related: ['tail-sheath', 'tail-tube', 'phage-genome'],
  },
  {
    id: 'host-range',
    term: 'Host range',
    shortDef: 'Spectrum of bacterial strains a phage can infect.',
    longDef:
      'The phage\'s "menu"—which bacteria it can (and can\'t) infect. Some phages are specialists (narrow host range, often just one species or even specific strains); others are generalists (broad host range, infecting across genera). Host range is determined by receptor recognition (can the phage bind?), defense evasion (can it avoid CRISPR, restriction enzymes?), and replication compatibility (can it use the host\'s machinery?). For phage therapy, host range determines which infections a phage can treat.',
    category: 'Phage',
    related: ['tail-fiber', 'receptor-binding-protein'],
  },
  {
    id: 'temperate-phage',
    term: 'Temperate phage',
    shortDef: 'Phage capable of choosing between lysogeny or lytic growth.',
    longDef:
      'A phage with the genetic circuitry to "decide" its infection strategy. Under favorable conditions (healthy host, low competition), it may go lytic for immediate reproduction. Under stress or high multiplicity of infection, it may integrate as a prophage and wait for better times. Lambda (λ) is the classic example, with its cI/Cro bistable switch. The term "temperate" emphasizes this flexibility—the phage moderates its behavior based on circumstances.',
    category: 'Phage',
    related: ['lysogeny', 'prophage', 'lytic-cycle', 'virulent-phage'],
  },
  {
    id: 'virulent-phage',
    term: 'Virulent phage',
    shortDef: 'Phage that always follows the lytic lifecycle.',
    longDef:
      'A phage locked into the "smash-and-grab" strategy with no option for lysogeny. It lacks the integrase, repressor genes, or regulatory switches needed for stable dormancy. Every successful infection ends in host death and virion release. T4 and T7 are classic examples. The term "virulent" can be confusing—it does not mean more dangerous to humans, just that the phage is obligately lytic toward its bacterial host.',
    category: 'Phage',
    related: ['lytic-cycle', 'temperate-phage'],
  },
  {
    id: 'lysogeny',
    term: 'Lysogeny',
    shortDef: 'Dormant integration of a temperate phage into the host genome.',
    longDef:
      'Think of it as the "sleeper agent" strategy: the phage integrates its DNA as a prophage and hitchhikes on the host\'s replication machinery for generations. The host survives and the phage genome is inherited by daughter cells—a long-term investment that trades immediate offspring for persistence and future opportunities. Under stress (UV, antibiotics, nutrient starvation), the prophage can "wake up" via induction and switch to lytic replication.',
    category: 'Phage',
    related: ['temperate-phage', 'prophage', 'lytic-cycle', 'chronic-infection'],
  },
  {
    id: 'lytic-cycle',
    term: 'Lytic cycle',
    shortDef: 'Phage lifecycle that ends with host lysis and virion release.',
    longDef:
      'Think of it as the "smash-and-grab" strategy: the phage hijacks the host\'s machinery to replicate as fast as possible, assembles 50-200 new virions, then bursts the cell open to release them. This is a high-risk, high-reward approach—maximum immediate offspring, but the host is destroyed and the neighborhood becomes crowded with competitors. The entire cycle takes only 30-60 minutes in fast-growing bacteria.',
    category: 'Phage',
    related: ['virulent-phage', 'holin', 'endolysin', 'lysogeny'],
  },
  {
    id: 'prophage',
    term: 'Prophage',
    shortDef: 'Integrated or latent form of a temperate phage genome.',
    longDef:
      'Silent within the host chromosome or as a plasmid-like element; can confer immunity to superinfection and new traits to the host.',
    category: 'Phage',
    related: ['lysogeny', 'temperate-phage'],
  },
  {
    id: 'chronic-infection',
    term: 'Chronic infection',
    shortDef: 'Phage replicates and releases particles without killing the host cell.',
    longDef:
      'Also called "extrusive" or "productive" infection. The phage continuously assembles new virions that bud or extrude through the cell membrane without lysing it. The host remains alive (though often growth-impaired) and keeps producing phage indefinitely. Common in filamentous phages like M13, fd, and f1 that infect F-pilus-bearing E. coli. This is a "third way" beyond the classic lytic/lysogenic dichotomy.',
    category: 'Phage',
    related: ['lytic-cycle', 'lysogeny', 'pseudolysogeny'],
  },
  {
    id: 'pseudolysogeny',
    term: 'Pseudolysogeny',
    shortDef: 'Unstable "paused" phage state that is neither true lysogeny nor active lytic growth.',
    longDef:
      'A messy intermediate where phage DNA persists in the cell without integrating into the chromosome or actively replicating. Often occurs when host resources are depleted—the phage is "stuck" waiting for better conditions. Unlike true lysogeny, the phage genome is not stably inherited and can be lost during cell division. Sometimes called a "carrier state." Important in environmental samples where starved cells dominate.',
    category: 'Phage',
    related: ['lysogeny', 'chronic-infection', 'lytic-cycle'],
  },
  {
    id: 'packaging-motor',
    term: 'Packaging motor',
    shortDef: 'ATP-driven complex that stuffs DNA into the capsid.',
    longDef:
      'One of the most powerful molecular motors known—the "DNA pump" that crams the phage genome into the capsid at pressures exceeding 60 atmospheres. Imagine stuffing 100 meters of rope into a tennis ball. The motor sits on the portal, grabs DNA, and ratchets it in using ATP hydrolysis. Speed: up to 2,000 base pairs per second. This compression stores energy that later helps shoot the DNA into the host.',
    category: 'Phage',
    related: ['portal-protein', 'capsid', 'supercoiling'],
  },
  {
    id: 'burst-size',
    term: 'Burst size',
    shortDef: 'Average number of virions released per infected cell.',
    longDef:
      'The phage\'s "offspring count"—how many new phages pop out when an infected cell bursts. Typical values: 50-200 for most phages, but ranges from ~10 (resource-limited conditions) to 1000+ (large hosts, efficient phages). It\'s a key fitness metric: more offspring = more infections = evolutionary success. But there\'s a trade-off with timing—wait longer, make more phages, but risk the host dying first.',
    category: 'Phage',
    related: ['latent-period', 'lytic-cycle'],
  },
  {
    id: 'latent-period',
    term: 'Latent period',
    shortDef: 'Time between phage adsorption and cell lysis.',
    longDef:
      'The "incubation time"—how long the phage takes to replicate inside the host before bursting out. For T4 in fast-growing E. coli: ~25 minutes. It\'s a crucial life-history trait: lyse early (short latent period) and spread fast but with fewer offspring; lyse late (long latent period) and make more phages but risk losing the race. Some phages even adjust timing based on conditions.',
    category: 'Phage',
    related: ['burst-size', 'lytic-cycle'],
  },
  {
    id: 'plaque',
    term: 'Plaque',
    shortDef: 'Clear or turbid zone on a bacterial lawn caused by phage lysis.',
    longDef:
      'The visible "footprint" of phage infection. Spread bacteria on a plate, add phages, and you\'ll see circular clearings where phages killed the bacteria. Each plaque started from a single phage particle. Plaque size reflects burst size, latent period, and diffusion rate. Turbid (cloudy) plaques suggest temperate phages where some bacteria survive as lysogens. Plaque assays are how phages were first discovered and remain a standard technique for counting and isolating phages.',
    category: 'Phage',
    related: ['burst-size', 'latent-period'],
  },
  {
    id: 'holin',
    term: 'Holin',
    shortDef: 'Membrane protein that times lysis by forming pores.',
    longDef:
      'The phage\'s "timer"—a membrane protein that accumulates silently, then suddenly triggers to form holes in the inner membrane at precisely the right moment. This releases the endolysin to attack the cell wall. Holin timing is exquisitely controlled (to the minute!) and determines the latent period. Lambda\'s holin is the best-studied molecular clock in biology—an all-or-none switch that commits the cell to death.',
    category: 'Phage',
    related: ['endolysin', 'spanin', 'lytic-cycle'],
  },
  {
    id: 'endolysin',
    term: 'Endolysin',
    shortDef: 'Enzyme that degrades the bacterial cell wall during lysis.',
    longDef:
      'The "wall-breaker"—an enzyme that chews through peptidoglycan, the mesh-like polymer that gives bacteria their shape and holds them together against osmotic pressure. Once the holin opens holes in the membrane, endolysin floods through and digests the wall. Without the wall, the cell explodes from internal pressure, releasing hundreds of phages. Endolysins are being developed as antibiotics ("enzybiotics").',
    category: 'Phage',
    related: ['holin', 'spanin', 'lytic-cycle'],
  },
  {
    id: 'spanin',
    term: 'Spanin',
    shortDef: 'Protein complex that disrupts the outer membrane of Gram-negative hosts.',
    longDef:
      'Acts after endolysin to complete lysis by fusing inner and outer membranes, ensuring full envelope failure.',
    category: 'Phage',
    related: ['holin', 'endolysin'],
  },
  {
    id: 'concatemer',
    term: 'Concatemer',
    shortDef: 'Long DNA molecule containing repeated genome copies end-to-end.',
    longDef:
      'Intermediate replication form processed by packaging motors using headful or specific cut sites to generate genome-length segments.',
    category: 'Phage',
    related: ['packaging-motor', 'headful-packaging'],
  },
  {
    id: 'headful-packaging',
    term: 'Headful packaging',
    shortDef: 'DNA packaging strategy that fills the capsid to capacity rather than fixed ends.',
    longDef:
      'Cuts DNA after a capsid is full, producing terminal redundancy. Enables rapid packaging of concatemeric genomes.',
    category: 'Phage',
    related: ['concatemer', 'packaging-motor'],
  },
];

const EVOLUTION_TERMS: GlossaryTerm[] = [
  {
    id: 'mutation',
    term: 'Mutation',
    shortDef: 'Heritable change in nucleotide sequence.',
    longDef:
      'Arises from replication errors, DNA damage, or mobile elements. Provides raw material for evolution and can alter phage-host interactions.',
    category: 'Evolution',
    related: ['point-mutation', 'indel', 'selection'],
  },
  {
    id: 'point-mutation',
    term: 'Point mutation',
    shortDef: 'Single-nucleotide change such as substitution.',
    longDef:
      'Can be silent, missense, or nonsense, affecting protein function or regulation depending on context.',
    category: 'Evolution',
    related: ['mutation', 'selection'],
  },
  {
    id: 'indel',
    term: 'Insertion/deletion (indel)',
    shortDef: 'Addition or loss of nucleotides in DNA.',
    longDef:
      'May cause frameshifts or modify regulatory spacing, with effects ranging from neutral to lethal.',
    category: 'Evolution',
    related: ['mutation', 'frameshift'],
  },
  {
    id: 'recombination',
    term: 'Recombination',
    shortDef: 'Exchange of genetic material between DNA molecules.',
    longDef:
      'Nature\'s "copy-paste" between genomes. When two DNA molecules break and rejoin with exchanged parts, you get recombination. For phages, this is a major evolutionary force: two phages co-infecting the same cell can swap genes, creating hybrid offspring with new combinations of traits. This is why phage evolution is so fast—they don\'t just mutate, they mix and match entire functional modules.',
    category: 'Evolution',
    related: ['mosaic-genome', 'horizontal-gene-transfer'],
  },
  {
    id: 'mosaic-genome',
    term: 'Mosaic genome',
    shortDef: 'Genome composed of modules from diverse origins.',
    longDef:
      'Phage genomes are "patchwork quilts"—stitched together from pieces with different evolutionary histories. The tail genes might come from one ancestor, the capsid genes from another, the lysis genes from a third. This modularity means phages evolve by swapping parts, not just point mutations. When you compare phage genomes, you often see blocks of similarity interrupted by completely different sequences. It\'s evolution by recombinatorial Lego.',
    category: 'Evolution',
    related: ['recombination', 'horizontal-gene-transfer'],
  },
  {
    id: 'gene-duplication',
    term: 'Gene duplication',
    shortDef: 'Creation of an extra copy of a gene or region.',
    longDef:
      'Provides redundancy that can diverge to new functions or increase dosage. Rare but impactful in compact phage genomes.',
    category: 'Evolution',
    related: ['mutation', 'selection'],
  },
  {
    id: 'horizontal-gene-transfer',
    term: 'Horizontal gene transfer (HGT)',
    shortDef: 'Movement of genes between organisms outside inheritance.',
    longDef:
      'Genes moving "sideways" between organisms rather than parent-to-child. It\'s how bacteria rapidly acquire antibiotic resistance, toxin genes, or metabolic capabilities. Phages are major HGT vectors—they accidentally (or intentionally) carry host genes between cells. This is why bacterial genomes are so plastic: they can gain new capabilities in a single generation rather than waiting for mutations. Evolution on fast-forward.',
    category: 'Evolution',
    related: ['transduction', 'transformation', 'conjugation'],
  },
  {
    id: 'transduction',
    term: 'Transduction',
    shortDef: 'Phage-mediated transfer of host DNA to another cell.',
    longDef:
      'Phages as "gene mailmen." Sometimes during packaging, a phage accidentally grabs host DNA instead of (or along with) its own genome. When this defective phage infects a new cell, it delivers bacterial genes instead of phage genes. Generalized transduction moves random host DNA; specialized transduction (from prophage excision errors) moves specific genes near the integration site. P1 phage is the classic transduction workhorse.',
    category: 'Evolution',
    related: ['horizontal-gene-transfer', 'prophage'],
  },
  {
    id: 'transformation',
    term: 'Transformation',
    shortDef: 'Uptake of free DNA from the environment.',
    longDef:
      'Competent cells incorporate external DNA, which can recombine into the genome or persist as plasmids.',
    category: 'Evolution',
    related: ['horizontal-gene-transfer'],
  },
  {
    id: 'conjugation',
    term: 'Conjugation',
    shortDef: 'Direct DNA transfer between cells via contact.',
    longDef:
      'Plasmid-encoded machinery forms a mating bridge to move DNA. Can spread phage resistance or host factors influencing phage infection.',
    category: 'Evolution',
    related: ['horizontal-gene-transfer'],
  },
  {
    id: 'selection',
    term: 'Selection',
    shortDef: 'Differential survival or reproduction based on genotype.',
    longDef:
      'Filters mutations, favoring advantageous changes and purging deleterious ones. Phage fitness depends on host environment and defense systems.',
    category: 'Evolution',
    related: ['positive-selection', 'purifying-selection', 'fitness-landscape'],
  },
  {
    id: 'purifying-selection',
    term: 'Purifying selection',
    shortDef: 'Selection that removes deleterious mutations.',
    longDef:
      'Maintains essential functions and sequence conservation, often visible as low nonsynonymous substitution rates.',
    category: 'Evolution',
    related: ['selection'],
  },
  {
    id: 'positive-selection',
    term: 'Positive selection',
    shortDef: 'Selection favoring beneficial mutations that increase fitness.',
    longDef:
      'Drives adaptive changes such as altered host range or immune evasion; detected via elevated nonsynonymous rates.',
    category: 'Evolution',
    related: ['selection'],
  },
  {
    id: 'genetic-drift',
    term: 'Genetic drift',
    shortDef: 'Random fluctuation of allele frequencies in populations.',
    longDef:
      'Evolution\'s "random walk"—genetic changes that happen by chance rather than selection. In small populations, random sampling matters: even beneficial mutations can be lost by bad luck, and neutral or harmful ones can spread. Phages experience extreme drift when only a few particles start each new infection. This randomness is why small population evolution is unpredictable, and why bottlenecks can dramatically reshape genetic diversity.',
    category: 'Evolution',
    related: ['population-bottleneck'],
  },
  {
    id: 'population-bottleneck',
    term: 'Population bottleneck',
    shortDef: 'Sharp reduction in population size that amplifies drift.',
    longDef:
      'When a population crashes to a few individuals, most genetic diversity is lost—like squeezing a diverse crowd through a narrow door and seeing who makes it through. For phages, bottlenecks happen constantly: each new infection starts from one or a few particles. This means phage populations lose diversity with each transmission, and rare variants can suddenly dominate by chance. Serial bottlenecks can fix mutations that selection alone wouldn\'t favor.',
    category: 'Evolution',
    related: ['genetic-drift', 'selection'],
  },
  {
    id: 'fitness-landscape',
    term: 'Fitness landscape',
    shortDef: 'Mapping of genotype to reproductive success.',
    longDef:
      'Imagine a mountainous terrain where height represents fitness and each location is a genotype. Evolution is like climbing uphill: mutations let you step to neighboring spots, and selection pushes you toward peaks. But the landscape is rugged—local peaks may not be the highest, and getting to a better peak might require crossing a valley (passing through less-fit intermediates). This metaphor helps explain why evolution can get "stuck" and why the same starting point can lead to different outcomes.',
    category: 'Evolution',
    related: ['selection', 'mutation'],
  },
  {
    id: 'homolog',
    term: 'Homolog',
    shortDef: 'Gene related by shared ancestry.',
    longDef:
      'Includes orthologs (diverged after speciation) and paralogs (after duplication). Homology inference guides annotation.',
    category: 'Evolution',
    related: ['ortholog', 'paralog'],
  },
  {
    id: 'ortholog',
    term: 'Ortholog',
    shortDef: 'Homologous genes in different species that diverged via speciation.',
    longDef:
      'Typically retain similar function; essential for cross-species comparison and annotation transfer.',
    category: 'Evolution',
    related: ['homolog', 'paralog'],
  },
  {
    id: 'paralog',
    term: 'Paralog',
    shortDef: 'Homologous genes that arose via duplication within a genome.',
    longDef:
      'May diverge to new or specialized functions, contributing to gene family expansion.',
    category: 'Evolution',
    related: ['homolog', 'ortholog'],
  },
  {
    id: 'synteny',
    term: 'Synteny',
    shortDef: 'Conservation of gene order across genomes.',
    longDef:
      'Breaks in synteny can indicate recombination, horizontal transfer, or rearrangements; useful for tracking evolutionary history.',
    category: 'Evolution',
    related: ['mosaic-genome', 'horizontal-gene-transfer'],
  },
  {
    id: 'mobile-genetic-element',
    term: 'Mobile genetic element',
    shortDef: 'DNA element capable of moving within or between genomes.',
    longDef:
      'Includes transposons, integrative elements, and plasmids. They reshape genomes and can carry defense or virulence genes.',
    category: 'Evolution',
    related: ['horizontal-gene-transfer', 'mutation'],
  },
];

const ANALYSIS_TERMS: GlossaryTerm[] = [
  {
    id: 'gc-content',
    term: 'GC content',
    shortDef: 'Fraction of G and C bases in a DNA sequence.',
    longDef:
      'A genome\'s "thermal fingerprint"—the percentage of bases that are G or C (versus A or T). GC content varies dramatically: from ~25% in some parasites to ~75% in some bacteria. It affects DNA stability (more GC = higher melting temperature), codon usage, and even which amino acids a genome prefers. Phages often match their host\'s GC content; mismatches can indicate recent host jumps or horizontal transfer.',
    category: 'Analysis',
    related: ['gc-skew', 'k-mer'],
  },
  {
    id: 'gc-skew',
    term: 'GC skew',
    shortDef: 'Relative excess of G over C across a window.',
    longDef:
      'A compositional asymmetry that reveals how DNA was replicated. The leading strand tends to accumulate G over C (and T over A) due to mutation biases during replication. Plot cumulative GC skew around a circular genome and you\'ll often see a clear switch point—that\'s the replication origin. It\'s like a fossil record of replication history written into the sequence itself.',
    category: 'Analysis',
    related: ['gc-content', 'replication-origin'],
  },
  {
    id: 'k-mer',
    term: 'k-mer',
    shortDef: 'Substring of length k within a sequence.',
    longDef:
      'The "word frequency" approach to sequences. Chop a genome into all overlapping words of length k (e.g., k=4 gives 4-mers like ATGC, TGCA, GCAT...) and count them. The resulting frequency profile is like a fingerprint—similar sequences have similar k-mer spectra. Used for assembly, species identification, complexity analysis, and detecting contamination. No alignment needed, making it fast and scalable.',
    category: 'Analysis',
    related: ['sequence-complexity', 'shannon-entropy'],
  },
  {
    id: 'sequence-complexity',
    term: 'Sequence complexity',
    shortDef: 'Measure of variability or repetitiveness in a sequence.',
    longDef:
      'How "interesting" is a sequence? High complexity means diverse, information-rich DNA with many different k-mers. Low complexity means repetitive stretches (ATATATATAT...) or homopolymers (AAAAAAA...). Low-complexity regions cause problems: they\'re hard to align, easy to misassemble, and can give false matches. Masking or filtering them is a standard first step in many analyses.',
    category: 'Analysis',
    related: ['k-mer', 'shannon-entropy'],
  },
  {
    id: 'shannon-entropy',
    term: 'Shannon entropy',
    shortDef: 'Information content metric based on symbol frequencies.',
    longDef:
      'A measure of "surprise" or unpredictability, borrowed from information theory. High entropy means high diversity (hard to predict the next symbol); low entropy means patterns (easy to predict). In sequences: a position where all aligned sequences have the same base has zero entropy (perfectly conserved); a position with equal A/T/G/C has maximum entropy (~2 bits). Use it to find conserved regions (low entropy) or variable regions (high entropy).',
    category: 'Analysis',
    related: ['sequence-complexity'],
  },
  {
    id: 'motif',
    term: 'Motif',
    shortDef: 'Short recurring sequence pattern with functional significance.',
    longDef:
      'Represents protein-binding sites, promoters, or structural signals. Often captured as position weight matrices.',
    category: 'Analysis',
    related: ['consensus-sequence', 'regulatory-motif'],
  },
  {
    id: 'consensus-sequence',
    term: 'Consensus sequence',
    shortDef: 'Most common base at each position of aligned sequences.',
    longDef:
      'Summarizes motifs or conserved elements, guiding primer design and variant interpretation.',
    category: 'Analysis',
    related: ['motif', 'alignment'],
  },
  {
    id: 'alignment',
    term: 'Sequence alignment',
    shortDef: 'Arrangement of sequences to maximize similarity and detect homology.',
    longDef:
      'The fundamental operation of comparative genomics: lining up sequences to see what\'s similar and what\'s different. Like laying two sentences side by side and seeing which words match. Insertions and deletions create "gaps" in the alignment. Good alignments reveal evolutionary relationships, conserved functional regions, and the location of mutations. Everything from BLAST searches to phylogenetic trees depends on alignment.',
    category: 'Analysis',
    related: ['pairwise-alignment', 'multiple-sequence-alignment', 'synteny'],
  },
  {
    id: 'pairwise-alignment',
    term: 'Pairwise alignment',
    shortDef: 'Alignment of two sequences to assess similarity.',
    longDef:
      'Can be global (Needleman–Wunsch) or local (Smith–Waterman). Provides identity metrics and variant calls.',
    category: 'Analysis',
    related: ['alignment'],
  },
  {
    id: 'multiple-sequence-alignment',
    term: 'Multiple sequence alignment',
    shortDef: 'Alignment of three or more sequences simultaneously.',
    longDef:
      'Reveals conserved residues, motifs, and evolutionary relationships; input for phylogenetic tree building.',
    category: 'Analysis',
    related: ['alignment', 'phylogenetic-tree'],
  },
  {
    id: 'dot-plot',
    term: 'Dot plot',
    shortDef: 'Matrix visualization of sequence similarity.',
    longDef:
      'The simplest way to compare two sequences visually. Put one sequence on each axis, mark a dot wherever they match, and patterns emerge: a diagonal line means the sequences are similar in that region; parallel diagonals mean repeats; broken diagonals mean insertions or deletions; perpendicular patterns can indicate inversions. No assumptions, no parameters—just raw pattern recognition. Great for seeing the big picture before detailed alignment.',
    category: 'Analysis',
    related: ['synteny-map', 'alignment'],
  },
  {
    id: 'synteny-map',
    term: 'Synteny map',
    shortDef: 'Visual comparison of gene order between genomes.',
    longDef:
      'A "roadmap" comparing gene arrangements between two genomes. Conserved gene order (synteny) shows up as parallel blocks; rearrangements, inversions, or insertions appear as breaks or crossed lines. For phages, synteny maps reveal their mosaic nature: some regions are perfectly conserved between relatives, while others have been swapped, inverted, or replaced entirely. It\'s like comparing two editions of a book to see which chapters moved around.',
    category: 'Analysis',
    related: ['dot-plot', 'synteny'],
  },
  {
    id: 'phylogenetic-tree',
    term: 'Phylogenetic tree',
    shortDef: 'Diagram of evolutionary relationships inferred from sequences.',
    longDef:
      'A "family tree" for sequences or organisms, showing who\'s related to whom and how closely. Branch lengths often represent evolutionary distance (more changes = longer branch). Trees are built from sequence alignments using various methods (neighbor-joining, maximum likelihood, Bayesian). For phages, trees are tricky because of rampant horizontal transfer and recombination—different genes may have different trees, revealing the mosaic nature of phage evolution.',
    category: 'Analysis',
    related: ['alignment', 'homolog'],
  },
  {
    id: 'read-coverage',
    term: 'Read coverage',
    shortDef: 'Number of sequencing reads covering each genomic position.',
    longDef:
      'Uniform coverage indicates even sequencing; spikes or dips can signal repeats, amplification bias, or deletions.',
    category: 'Analysis',
    related: ['sliding-window'],
  },
  {
    id: 'quality-score',
    term: 'Quality score',
    shortDef: 'Phred-like metric estimating sequencing error probability.',
    longDef:
      'Guides trimming and variant confidence; low scores can distort assemblies and alignments.',
    category: 'Analysis',
    related: ['read-coverage'],
  },
  {
    id: 'sliding-window',
    term: 'Sliding window',
    shortDef: 'Technique applying calculations across successive windows of a sequence.',
    longDef:
      'Used for GC content, entropy, or coverage smoothing to reveal local variation without losing global context.',
    category: 'Analysis',
    related: ['gc-content', 'read-coverage'],
  },
  {
    id: 'restriction-site',
    term: 'Restriction site',
    shortDef: 'Specific DNA sequence recognized by restriction enzymes.',
    longDef:
      'Palindromic motifs where enzymes cut DNA; mapping sites aids cloning, digestion assays, and genome engineering.',
    category: 'Analysis',
    related: ['motif', 'base-pair'],
  },
  {
    id: 'codon-usage-bias',
    term: 'Codon usage bias',
    shortDef: 'Non-uniform use of synonymous codons across genes or genomes.',
    longDef:
      'Reflects selection for translational efficiency and accuracy; influences heterologous expression success.',
    category: 'Analysis',
    related: ['codon-bias', 'transfer-rna'],
  },
  {
    id: 'hydropathy-plot',
    term: 'Hydropathy plot',
    shortDef: 'Graph of hydrophobicity across a protein sequence.',
    longDef:
      'Identifies transmembrane segments and surface-exposed regions, guiding structural hypotheses.',
    category: 'Analysis',
    related: ['amino-acid', 'protein-folding'],
  },
  {
    id: 'secondary-structure-prediction',
    term: 'Secondary structure prediction',
    shortDef: 'Computational forecast of helices, sheets, and loops in proteins or RNAs.',
    longDef:
      'Uses sequence signals and statistical models to infer local folding motifs that influence function.',
    category: 'Analysis',
    related: ['protein-folding'],
  },
  {
    id: 'primer-design',
    term: 'Primer design',
    shortDef: 'Selection of oligos for amplification or sequencing.',
    longDef:
      'Balances Tm, GC content, length, and specificity to target regions without off-target binding or secondary structures.',
    category: 'Analysis',
    related: ['melting-temperature', 'complementarity'],
  },
  {
    id: 'open-reading-frame-scan',
    term: 'ORF scanning',
    shortDef: 'Computational search for potential coding regions.',
    longDef:
      'Identifies start/stop codon combinations and coding potential across frames, seeding downstream annotation.',
    category: 'Analysis',
    related: ['open-reading-frame', 'coding-sequence'],
  },
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  ...DNA_TERMS,
  ...GENE_TERMS,
  ...TRANSLATION_TERMS,
  ...PHAGE_TERMS,
  ...EVOLUTION_TERMS,
  ...ANALYSIS_TERMS,
];

export const glossaryIndex: Map<GlossaryId, GlossaryTerm> = new Map(
  GLOSSARY_TERMS.map((entry) => [entry.id, entry])
);

export const glossaryCategories: GlossaryCategory[] = ['DNA', 'Gene', 'Translation', 'Phage', 'Evolution', 'Analysis'];

