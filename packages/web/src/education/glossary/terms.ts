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
      'Two antiparallel strands wound around a common axis with major and minor grooves. Stabilized by base stacking and hydrogen bonding between paired bases.',
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
      'Moving complex containing helicase, primase, and polymerases that synthesize leading and lagging strands concurrently.',
    category: 'DNA',
    related: ['leading-strand', 'lagging-strand', 'okazaki-fragment'],
  },
  {
    id: 'leading-strand',
    term: 'Leading strand',
    shortDef: 'Continuously synthesized DNA strand oriented 5′→3′ toward fork.',
    longDef:
      'Polymerase follows helicase without interruption because template is oriented for continuous extension in the direction of fork movement.',
    category: 'DNA',
    related: ['lagging-strand', 'replication-fork'],
  },
  {
    id: 'lagging-strand',
    term: 'Lagging strand',
    shortDef: 'Discontinuously synthesized strand built in Okazaki fragments.',
    longDef:
      'Template runs opposite fork direction, forcing polymerase to generate short segments that are later ligated into a continuous strand.',
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
      'Topological state affecting accessibility and transcription. Phage packaging motors and topoisomerases manipulate supercoils during infection.',
    category: 'DNA',
    related: ['topoisomerase', 'packaging-motor'],
  },
  {
    id: 'topoisomerase',
    term: 'Topoisomerase',
    shortDef: 'Enzyme that cuts and rejoins DNA to relax or introduce supercoils.',
    longDef:
      'Controls DNA topology by transiently breaking strands, allowing passage of DNA segments, then resealing to relieve torsional stress.',
    category: 'DNA',
    related: ['supercoiling', 'replication-fork'],
  },
  {
    id: 'melting-temperature',
    term: 'Melting temperature (Tm)',
    shortDef: 'Temperature where half of DNA duplex becomes single-stranded.',
    longDef:
      'Depends on GC content, length, and salt concentration. Guides PCR primer design and hybridization-based assays.',
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
      'Begins at a start codon and ends at a stop codon, defining the exact amino acid chain produced by translation.',
    category: 'Gene',
    related: ['open-reading-frame', 'start-codon', 'stop-codon'],
  },
  {
    id: 'open-reading-frame',
    term: 'Open reading frame (ORF)',
    shortDef: 'Stretch of nucleotides with start, in-frame codons, and stop.',
    longDef:
      'Candidate coding region lacking internal stops in a given frame. ORF detection is a first step toward annotating protein-coding genes.',
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
      'Often contains conserved boxes that position polymerase near the transcription start site. Strength and sequence context tune expression levels.',
    category: 'Gene',
    related: ['transcription-start-site', 'regulatory-motif'],
  },
  {
    id: 'operator',
    term: 'Operator',
    shortDef: 'Regulatory DNA site bound by repressors or activators.',
    longDef:
      'Overlaps or sits near promoter to modulate RNA polymerase access, enabling inducible or repressible control of gene expression.',
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
      'Base-pairs with 16S rRNA (Shine–Dalgarno sequence) to position the start codon in the P site, controlling initiation efficiency.',
    category: 'Gene',
    related: ['start-codon', 'translation-initiation'],
  },
  {
    id: 'shine-dalgarno-sequence',
    term: 'Shine–Dalgarno sequence',
    shortDef: 'Purine-rich RBS motif that pairs with 16S rRNA anti-SD site.',
    longDef:
      'Key bacterial translation initiation element located a few bases upstream of the start codon; its spacing and strength tune protein output.',
    category: 'Gene',
    related: ['ribosome-binding-site', 'translation-initiation'],
  },
  {
    id: 'operon',
    term: 'Operon',
    shortDef: 'Cluster of genes transcribed as a single polycistronic mRNA.',
    longDef:
      'Enables coordinated regulation of related functions (e.g., lysis genes). One promoter drives multiple coding sequences separated by RBS sites.',
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
      'Composed of rRNA and proteins forming small (30S) and large (50S) subunits in bacteria. Coordinates mRNA decoding and peptide bond formation.',
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
      'Read sequentially by the ribosome; the genetic code maps 64 possible triplets to 20 amino acids and stop signals.',
    category: 'Translation',
    related: ['anticodon', 'reading-frame', 'amino-acid'],
  },
  {
    id: 'reading-frame',
    term: 'Reading frame',
    shortDef: 'Partition of a nucleotide sequence into non-overlapping codons.',
    longDef:
      'Three possible frames per strand; shifting by one base changes every downstream codon. Accurate frame selection is essential for correct protein output.',
    category: 'Translation',
    related: ['codon', 'frameshift', 'open-reading-frame'],
  },
  {
    id: 'frameshift',
    term: 'Frameshift',
    shortDef: 'Insertion or deletion that alters the reading frame of translation.',
    longDef:
      'Changes downstream amino acid sequence and often introduces premature stops. Some phages use programmed frameshifts to regulate protein ratios.',
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
      'Allows one tRNA to recognize multiple codons, contributing to genetic code degeneracy and codon usage preferences.',
    category: 'Translation',
    related: ['anticodon', 'codon-bias'],
  },
  {
    id: 'codon-bias',
    term: 'Codon usage bias',
    shortDef: 'Preference for specific synonymous codons in a genome.',
    longDef:
      'Reflects tRNA abundance, expression levels, and evolutionary pressures. Phages adapt codon usage to host tRNA pools.',
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
      'Often icosahedral; provides protection and structural attachment for tail components. Assembled from repeated capsomers.',
    category: 'Phage',
    related: ['portal-protein', 'tail', 'virion'],
  },
  {
    id: 'portal-protein',
    term: 'Portal protein',
    shortDef: 'Gate-like capsid protein where DNA enters and exits.',
    longDef:
      'Forms a dodecameric ring that interfaces with the packaging motor and tail, ensuring one-way genome translocation and sealing after packaging.',
    category: 'Phage',
    related: ['packaging-motor', 'capsid'],
  },
  {
    id: 'tail',
    term: 'Tail',
    shortDef: 'Phage appendage that delivers the genome into the host.',
    longDef:
      'Composed of sheath, tube, baseplate, and fibers. Coordinates attachment, sheath contraction (for contractile tails), and genome injection.',
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
      'Mediated by tail fibers/spikes binding receptors such as LPS, teichoic acids, or porins, preceding genome injection.',
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
      'Defined by receptor recognition, defense evasion, and replication compatibility. Tail fiber mutations can broaden or shift host range.',
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
      'Generates high forces to condense the genome through the portal protein, often following headful or specific end signals.',
    category: 'Phage',
    related: ['portal-protein', 'capsid', 'supercoiling'],
  },
  {
    id: 'burst-size',
    term: 'Burst size',
    shortDef: 'Average number of virions released per infected cell.',
    longDef:
      'Depends on genome replication efficiency, assembly, and timing of lysis. Key metric for phage fitness and therapy dosing.',
    category: 'Phage',
    related: ['latent-period', 'lytic-cycle'],
  },
  {
    id: 'latent-period',
    term: 'Latent period',
    shortDef: 'Time between phage adsorption and cell lysis.',
    longDef:
      'Encompasses genome replication, transcriptional program, assembly, and lysis timing. Balances burst size against infection speed.',
    category: 'Phage',
    related: ['burst-size', 'lytic-cycle'],
  },
  {
    id: 'plaque',
    term: 'Plaque',
    shortDef: 'Clear or turbid zone on a bacterial lawn caused by phage lysis.',
    longDef:
      'Represents localized cycles of infection and lysis; plaque morphology reflects burst size, diffusion, and lysogeny propensity.',
    category: 'Phage',
    related: ['burst-size', 'latent-period'],
  },
  {
    id: 'holin',
    term: 'Holin',
    shortDef: 'Membrane protein that times lysis by forming pores.',
    longDef:
      'Accumulates in the inner membrane then triggers to allow endolysin access to the cell wall, coordinating precise lysis timing.',
    category: 'Phage',
    related: ['endolysin', 'spanin', 'lytic-cycle'],
  },
  {
    id: 'endolysin',
    term: 'Endolysin',
    shortDef: 'Enzyme that degrades the bacterial cell wall during lysis.',
    longDef:
      'Accesses peptidoglycan after holin pore formation, collapsing cell integrity to release progeny virions.',
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
      'Generates mosaic genomes and repairs damage. Phages recombine during co-infection to shuffle modules and adapt.',
    category: 'Evolution',
    related: ['mosaic-genome', 'horizontal-gene-transfer'],
  },
  {
    id: 'mosaic-genome',
    term: 'Mosaic genome',
    shortDef: 'Genome composed of modules from diverse origins.',
    longDef:
      'Phage genomes often show patchwork organization due to recombination and module swapping across lineages.',
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
      'Occurs via phages (transduction), plasmids, or uptake of free DNA. Drives rapid acquisition of new capabilities.',
    category: 'Evolution',
    related: ['transduction', 'transformation', 'conjugation'],
  },
  {
    id: 'transduction',
    term: 'Transduction',
    shortDef: 'Phage-mediated transfer of host DNA to another cell.',
    longDef:
      'Generalized transduction packages random host fragments; specialized transduction moves genes near prophage integration sites.',
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
      'Strong in small populations or bottlenecks, potentially fixing neutral or mildly deleterious mutations.',
    category: 'Evolution',
    related: ['population-bottleneck'],
  },
  {
    id: 'population-bottleneck',
    term: 'Population bottleneck',
    shortDef: 'Sharp reduction in population size that amplifies drift.',
    longDef:
      'Occurs during infection cycles where few phages found new infections, reducing diversity and altering evolutionary trajectories.',
    category: 'Evolution',
    related: ['genetic-drift', 'selection'],
  },
  {
    id: 'fitness-landscape',
    term: 'Fitness landscape',
    shortDef: 'Mapping of genotype to reproductive success.',
    longDef:
      'Visualizes adaptive peaks and valleys; epistasis shapes paths available to evolving phages.',
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
      'Impacts melting temperature, codon usage bias, and structural stability. Local shifts can signal foreign DNA or functional regions.',
    category: 'Analysis',
    related: ['gc-skew', 'k-mer'],
  },
  {
    id: 'gc-skew',
    term: 'GC skew',
    shortDef: 'Relative excess of G over C across a window.',
    longDef:
      'Computed as (G - C)/(G + C). Cumulative skew can reveal replication origin and terminus in circular genomes.',
    category: 'Analysis',
    related: ['gc-content'],
  },
  {
    id: 'k-mer',
    term: 'k-mer',
    shortDef: 'Substring of length k within a sequence.',
    longDef:
      'k-mer frequency vectors underpin many analyses: complexity, classification, assembly, and contamination detection.',
    category: 'Analysis',
    related: ['sequence-complexity', 'shannon-entropy'],
  },
  {
    id: 'sequence-complexity',
    term: 'Sequence complexity',
    shortDef: 'Measure of variability or repetitiveness in a sequence.',
    longDef:
      'Low complexity regions contain repeats or homopolymers; high complexity suggests diverse k-mers. Affects alignment reliability.',
    category: 'Analysis',
    related: ['k-mer', 'shannon-entropy'],
  },
  {
    id: 'shannon-entropy',
    term: 'Shannon entropy',
    shortDef: 'Information content metric based on symbol frequencies.',
    longDef:
      'Calculates unpredictability of bases or k-mers. Used to highlight conserved versus variable regions.',
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
      'Includes pairwise or multiple alignments with scoring for matches, mismatches, and gaps. Foundation for comparative genomics.',
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
      'Places dots where subsequences match; diagonal lines show conserved regions, repeats, or rearrangements.',
    category: 'Analysis',
    related: ['synteny-map', 'alignment'],
  },
  {
    id: 'synteny-map',
    term: 'Synteny map',
    shortDef: 'Visual comparison of gene order between genomes.',
    longDef:
      'Depicts conserved blocks and rearrangements, helping spot horizontal transfers and structural variation.',
    category: 'Analysis',
    related: ['dot-plot', 'synteny'],
  },
  {
    id: 'phylogenetic-tree',
    term: 'Phylogenetic tree',
    shortDef: 'Diagram of evolutionary relationships inferred from sequences.',
    longDef:
      'Branches represent divergence events; built from alignments or distance matrices to contextualize phage lineage and gene flow.',
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

