/* Job description fit check. Runs in the browser only.
 *
 * SHOWN: skills with proof in a project card. Each proof is {card, fact}; the fact must appear
 *   verbatim in that card's text, otherwise the proof is dropped at runtime.
 * LISTED: skills that appear on the page (skills list, background) without a project proof.
 *   `evidence` must appear verbatim in the page text, otherwise the skill is dropped.
 * GAPS: common AI Engineer requirements that are not on the page. `related` names adjacent
 *   evidence that is on the page.
 * Aliases: matched case-insensitively on word boundaries, with an optional plural "s".
 *   A leading "=" makes an alias case-sensitive.
 */
(function () {
  var SHOWN = [
    { label: 'Python', aliases: ['python'], proof: [{ card: 'p-hybrid', fact: '93% Recall@10' }, { card: 'p-shipment', fact: '175 tests' }] },
    { label: 'RAG', aliases: ['rag', 'retrieval-augmented generation', 'retrieval augmented generation'], proof: [{ card: 'p-hybrid', fact: '93% Recall@10' }, { card: 'p-saas', fact: 'pgvector semantic search' }] },
    { label: 'GraphRAG', aliases: ['graphrag', 'graph rag', 'graph-based retrieval'], proof: [{ card: 'p-graphrag', fact: '+0.22 (95% CI +0.17 to +0.27)', say: '+0.22 EM over hybrid RAG on 375 test questions (95% CI +0.17 to +0.27)' }] },
    { label: 'Knowledge graphs', aliases: ['knowledge graph', 'knowledge-graph', 'graph database'], proof: [{ card: 'p-graphrag', fact: '12,547 relations from 2,049 documents' }] },
    { label: 'Neo4j', aliases: ['neo4j'], proof: [{ card: 'p-graphrag', fact: '12,547 relations from 2,049 documents' }] },
    { label: 'Information retrieval and search', aliases: ['information retrieval', 'semantic search', 'hybrid search', 'hybrid retrieval', 'retrieval', 'search systems', 'search engine'], proof: [{ card: 'p-hybrid', fact: '93% Recall@10' }] },
    { label: 'BM25', aliases: ['bm25', 'lexical search', 'keyword search', 'sparse retrieval'], proof: [{ card: 'p-hybrid', fact: '+11.4 pts vs BM25 only' }] },
    { label: 'Embeddings', aliases: ['embedding', 'dense retrieval', 'text embedding'], proof: [{ card: 'p-hybrid', fact: 'E5-base-v2 dense embeddings' }] },
    { label: 'Vector search', aliases: ['vector search', 'vector database', 'vector db', 'vector store', 'similarity search'], proof: [{ card: 'p-saas', fact: 'pgvector semantic search' }, { card: 'p-hybrid', fact: 'FAISS' }] },
    { label: 'FAISS', aliases: ['faiss'], proof: [{ card: 'p-hybrid', fact: '8.84M MS MARCO passages' }] },
    { label: 'pgvector', aliases: ['pgvector'], proof: [{ card: 'p-saas', fact: 'pgvector semantic search' }] },
    { label: 'Rerankers', aliases: ['reranker', 'reranking', 're-ranking', 'cross-encoder'], proof: [{ card: 'p-graphrag', fact: 'Cross-encoder reranker' }] },
    { label: 'LLMs', aliases: ['llm', 'large language model', 'generative ai', 'genai', 'gen ai', 'foundation model'], proof: [{ card: 'p-shipment', fact: 'extracts shipment details with an LLM' }, { card: 'p-graphrag', fact: '12,547 relations from 2,049 documents' }] },
    { label: 'LLM agents', aliases: ['agent', 'ai agent', 'llm agent', 'agentic', 'multi-agent', 'autonomous agent'], proof: [{ card: 'p-multiagent', fact: '4 agents' }, { card: 'p-react', fact: '3 tools' }] },
    { label: 'LangGraph', aliases: ['langgraph'], proof: [{ card: 'p-multiagent', fact: '4 agents' }] },
    { label: 'Tool use', aliases: ['tool use', 'tool calling', 'tool-calling', 'tool-use'], proof: [{ card: 'p-react', fact: 'web search, calculator and RAG retrieval' }, { card: 'p-n8n', fact: 'Works as a tool for the n8n AI Agent' }] },
    { label: 'Structured output and extraction', aliases: ['structured output', 'information extraction', 'entity extraction', 'relation extraction', 'json schema', 'data extraction', 'document extraction'], proof: [{ card: 'p-graphrag', fact: 'strict JSON schema output' }, { card: 'p-shipment', fact: '175 tests' }] },
    { label: 'Prompt engineering', aliases: ['prompt engineering', 'prompting', 'prompt design'], proof: [{ card: 'p-graphrag', fact: 'extraction recall 0.75, slot precision 0.89' }] },
    { label: 'Guardrails and human review', aliases: ['guardrail', 'prompt injection', 'human-in-the-loop', 'human in the loop', 'human review', 'ai safety'], proof: [{ card: 'p-shipment', fact: 'dangerous goods always go to a human' }] },
    { label: 'LLM evaluation', aliases: ['evaluation', 'evals', 'llm evaluation', 'model evaluation', 'benchmarking', 'benchmark'], proof: [{ card: 'p-llmeval', fact: 'Faithfulness 0.909 on 10 test questions' }, { card: 'p-graphrag', fact: 'hypothesis pre-registered, test split run once' }] },
    { label: 'RAGAS', aliases: ['ragas'], proof: [{ card: 'p-llmeval', fact: 'Faithfulness 0.909 on 10 test questions' }] },
    { label: 'Statistics', aliases: ['statistics', 'statistical', 'hypothesis testing', 'significance testing'], proof: [{ card: 'p-hybrid', fact: 'p = 0.002' }] },
    { label: 'Fine-tuning', aliases: ['fine-tuning', 'fine tuning', 'finetuning', 'lora', 'qlora', 'peft'], proof: [{ card: 'p-qlora', fact: 'Loss 2.47 → 0.89' }] },
    { label: 'Quantization', aliases: ['quantization', 'quantisation'], proof: [{ card: 'p-qlora', fact: '4-bit quantisation' }] },
    { label: 'PyTorch', aliases: ['pytorch'], proof: [{ card: 'p-qlora', fact: 'Loss 2.47 → 0.89' }] },
    { label: 'Hugging Face', aliases: ['hugging face', 'huggingface'], proof: [{ card: 'p-qlora', fact: 'Published on HuggingFace Hub' }] },
    { label: 'NLP', aliases: ['nlp', 'natural language processing'], proof: [{ card: 'p-hybrid', fact: '93% Recall@10' }, { card: 'p-shipment', fact: 'German and English' }] },
    { label: 'Machine learning', aliases: ['machine learning', '=ML'], proof: [{ card: 'p-qlora', fact: 'Loss 2.47 → 0.89' }, { card: 'p-hybrid', fact: '93% Recall@10' }] },
    { label: 'Gemini', aliases: ['gemini'], proof: [{ card: 'p-shipment', fact: 'Gemini' }, { card: 'p-triage', fact: 'Gemini extracts category, priority, sentiment' }] },
    { label: 'Groq', aliases: ['groq'], proof: [{ card: 'p-bauwatcher', fact: 'Groq LLM' }] },
    { label: 'Chat assistants', aliases: ['chatbot', 'chat bot', 'conversational ai', 'chat assistant', 'customer support ai'], proof: [{ card: 'p-saas', fact: 'ChatGPT-like SSE streaming' }] },
    { label: 'FastAPI', aliases: ['fastapi'], proof: [{ card: 'p-shipment', fact: '175 tests' }, { card: 'p-saas', fact: '12 pytest regression tests' }] },
    { label: 'REST APIs', aliases: ['rest api', 'restful', 'api development', 'apis', 'web api', 'openapi'], proof: [{ card: 'p-saas', fact: 'API →' }, { card: 'p-aws', fact: 'OpenAPI documentation' }] },
    { label: 'Backend engineering', aliases: ['backend', 'back-end', 'back end', 'server-side'], proof: [{ card: 'p-shipment', fact: 'Retries with backoff, attempts history, stuck-job recovery' }] },
    { label: 'SQL', aliases: ['sql'], proof: [{ card: 'p-shipment', fact: 'Job queue in SQLite' }, { card: 'p-saas', fact: 'PostgreSQL' }] },
    { label: 'PostgreSQL', aliases: ['postgresql', 'postgres'], proof: [{ card: 'p-saas', fact: 'PostgreSQL' }] },
    { label: 'SQLite', aliases: ['sqlite'], proof: [{ card: 'p-shipment', fact: 'Job queue in SQLite' }] },
    { label: 'Pydantic', aliases: ['pydantic'], proof: [{ card: 'p-shipment', fact: 'Pydantic' }] },
    { label: 'Testing', aliases: ['pytest', 'unit test', 'automated testing', 'test automation', 'testing', 'test-driven', 'tdd'], proof: [{ card: 'p-shipment', fact: '175 tests' }, { card: 'p-n8n', fact: '10 unit tests' }] },
    { label: 'Docker', aliases: ['docker', 'container', 'containerization', 'containerisation', 'docker compose'], proof: [{ card: 'p-saas', fact: 'Docker Compose → Railway' }, { card: 'p-k8s', fact: '2 replicas' }] },
    { label: 'Kubernetes', aliases: ['kubernetes', 'k8s'], proof: [{ card: 'p-k8s', fact: '2 replicas · rolling updates · health checks · resource limits' }] },
    { label: 'AWS', aliases: ['aws', 'amazon web services', 'ec2'], proof: [{ card: 'p-aws', fact: 'AWS EC2 Frankfurt' }] },
    { label: 'CI/CD', aliases: ['ci/cd', 'ci cd', 'continuous integration', 'github actions', 'ci pipeline'], proof: [{ card: 'p-n8n', fact: 'CI on every push' }, { card: 'p-saas', fact: 'GitHub Actions CI/CD' }] },
    { label: 'Monitoring', aliases: ['monitoring', 'prometheus', 'observability', 'health checks'], proof: [{ card: 'p-saas', fact: 'Prometheus monitoring' }] },
    { label: 'Deployment to production', aliases: ['deployment', 'deploying', 'production', 'productionize', 'productionise'], proof: [{ card: 'p-saas', fact: 'Idea to production in 7 days' }, { card: 'p-k8s', fact: '2 replicas' }] },
    { label: 'Linux', aliases: ['linux', 'unix', 'bash', 'shell scripting'], proof: [{ card: 'p-aws', fact: 'systemd auto-restart' }] },
    { label: 'TypeScript', aliases: ['typescript'], proof: [{ card: 'p-n8n', fact: '10 unit tests' }] },
    { label: 'JavaScript', aliases: ['javascript', '=JS'], proof: [{ card: 'p-saas', fact: 'embeddable JS widget' }] },
    { label: 'Node.js', aliases: ['node.js', 'nodejs', '=Node'], proof: [{ card: 'p-n8n', fact: '10 unit tests' }] },
    { label: 'React', aliases: ['=React', 'react.js', 'reactjs'], proof: [{ card: 'p-saas', fact: 'React dashboard' }, { card: 'p-bauwatcher', fact: 'React + Leaflet → Vercel frontend' }] },
    { label: 'Async Python', aliases: ['asyncio', 'async', 'asynchronous', 'concurrency'], proof: [{ card: 'p-bauwatcher', fact: '3,197 live roadworks' }] },
    { label: 'Workflow automation', aliases: ['n8n', 'workflow automation', 'automation', 'zapier', 'make.com'], proof: [{ card: 'p-n8n', fact: '10 unit tests' }, { card: 'p-triage', fact: 'Workflow running on n8n Cloud' }] },
    { label: 'Webhooks', aliases: ['webhook'], proof: [{ card: 'p-triage', fact: 'A webhook receives a ticket' }] },
    { label: 'Streaming responses', aliases: ['streaming', 'server-sent events', 'sse', 'websocket'], proof: [{ card: 'p-saas', fact: 'ChatGPT-like SSE streaming' }] },
    { label: 'Multi-tenant SaaS', aliases: ['saas', 'multi-tenant', 'multitenant', 'multi tenant'], proof: [{ card: 'p-saas', fact: 'Multi-tenant SaaS built solo in 7 days' }] },
    { label: 'Authentication', aliases: ['authentication', 'jwt', 'oauth', 'auth'], proof: [{ card: 'p-saas', fact: 'JWT auth with per-tenant data isolation' }] },
    { label: 'Queues and background jobs', aliases: ['queue', 'job queue', 'message queue', 'background job', 'background worker', 'task queue'], proof: [{ card: 'p-shipment', fact: 'Job queue in SQLite' }] },
    { label: 'Reliability', aliases: ['retries', 'retry', 'fault tolerance', 'fault-tolerant', 'resilience', 'idempotency', 'idempotent'], proof: [{ card: 'p-shipment', fact: 'Retries with backoff, attempts history, stuck-job recovery' }] },
    { label: 'Data pipelines', aliases: ['data pipeline', 'ingestion', 'data ingestion', 'etl', 'document ingestion', 'document processing'], proof: [{ card: 'p-saas', fact: 'Document ingestion pipeline' }, { card: 'p-bauwatcher', fact: 'Parallel async pipeline' }] },
    { label: 'Streamlit', aliases: ['streamlit'], proof: [{ card: 'p-llmeval', fact: 'Live radar chart on HuggingFace Spaces' }] },
    { label: 'Data visualization', aliases: ['data visualization', 'data visualisation', 'plotly', 'dashboard'], proof: [{ card: 'p-llmeval', fact: 'Live radar chart on HuggingFace Spaces' }] },
    { label: 'Git', aliases: ['git', 'github', 'version control', 'gitlab'], proof: [{ card: 'p-graphrag', fact: 'GitHub →', say: 'public GitHub repo' }, { card: 'p-shipment', fact: 'GitHub →', say: 'public GitHub repo' }, { card: 'p-n8n', fact: 'CI on every push' }] },
    { label: 'MLOps', aliases: ['mlops', 'ml ops', 'llmops'], proof: [{ card: 'p-k8s', fact: '2 replicas · rolling updates' }, { card: 'p-saas', fact: 'GitHub Actions CI/CD' }, { card: 'p-saas', fact: 'Prometheus monitoring' }] },
    { label: 'Open source', aliases: ['open source', 'open-source', 'oss'], proof: [{ card: 'p-n8n', fact: 'official n8n linter passing' }] }
  ];

  var LISTED = [
    { label: 'LangChain', aliases: ['langchain'], evidence: 'LangChain' },
    { label: 'Redis', aliases: ['redis'], evidence: 'Redis' },
    { label: 'SQLAlchemy', aliases: ['sqlalchemy'], evidence: 'SQLAlchemy' },
    { label: 'Data science', aliases: ['data science', 'data scientist'], evidence: 'MSc Data Science' },
    { label: 'Error analysis', aliases: ['error analysis'], evidence: 'Error analysis' },
    { label: 'Vercel and Railway', aliases: ['vercel', 'railway'], evidence: 'Vercel' }
  ];

  var GAPS = [
    { label: 'Azure', aliases: ['azure', 'microsoft azure'], related: 'AWS EC2' },
    { label: 'Azure AI', aliases: ['azure ai', 'azure ai search', 'azure ai foundry', 'azure ai studio', 'azure machine learning', 'azure ml', 'azure cognitive services', 'cognitive search'], related: 'Gemini, Groq' },
    { label: 'Microsoft Fabric', aliases: ['microsoft fabric', 'ms fabric', '=Fabric', 'onelake'], related: '' },
    { label: 'Power Platform', aliases: ['power platform', 'power apps', 'powerapps', 'power automate', 'power bi', 'powerbi', 'dataverse'], related: '' },
    { label: 'Copilot Studio', aliases: ['copilot studio', 'microsoft copilot', 'm365 copilot', 'microsoft 365 copilot'], related: 'LLM agents' },
    { label: 'Microsoft 365', aliases: ['microsoft 365', 'm365', 'office 365', 'o365', 'sharepoint', 'microsoft teams'], related: '' },
    { label: 'Entra ID', aliases: ['entra id', 'microsoft entra', 'entra', 'azure ad', 'azure active directory'], related: 'Authentication' },
    { label: 'Microsoft Purview', aliases: ['purview', 'microsoft purview'], related: 'Guardrails and human review' },
    { label: 'Azure OpenAI', aliases: ['azure openai'], related: 'Gemini, Groq' },
    { label: 'Google Cloud', aliases: ['gcp', 'google cloud', 'vertex ai', 'vertex'], related: 'AWS EC2' },
    { label: 'AWS SageMaker', aliases: ['sagemaker'], related: 'AWS EC2' },
    { label: 'AWS Bedrock', aliases: ['bedrock'], related: 'Gemini, Groq' },
    { label: 'OpenAI API', aliases: ['openai', 'gpt-4', 'gpt-4o', 'chatgpt api'], related: 'Gemini, Groq' },
    { label: 'Anthropic Claude API', aliases: ['anthropic', 'claude'], related: 'Gemini, Groq' },
    { label: 'LlamaIndex', aliases: ['llamaindex', 'llama index', 'llama-index'], related: 'LangGraph' },
    { label: 'CrewAI, AutoGen or Semantic Kernel', aliases: ['crewai', 'autogen', 'semantic kernel'], related: 'LangGraph' },
    { label: 'Model Context Protocol (MCP)', aliases: ['model context protocol', '=MCP'], related: 'LangGraph' },
    { label: 'DSPy', aliases: ['dspy'], related: 'LangGraph' },
    { label: 'Pinecone, Weaviate, Qdrant, Milvus or Chroma', aliases: ['pinecone', 'weaviate', 'qdrant', 'milvus', 'chroma', 'chromadb'], related: 'pgvector, FAISS' },
    { label: 'Elasticsearch or OpenSearch', aliases: ['elasticsearch', 'elastic search', 'opensearch'], related: 'BM25' },
    { label: 'MongoDB', aliases: ['mongodb', 'mongo'], related: 'PostgreSQL' },
    { label: 'LLM observability (Langfuse, LangSmith, W&B)', aliases: ['langfuse', 'langsmith', 'weights & biases', 'weights and biases', 'wandb', 'arize'], related: 'Prometheus' },
    { label: 'Model serving (vLLM, TGI, Triton, ONNX)', aliases: ['vllm', 'tgi', 'triton', 'onnx', 'tensorrt', 'model serving', 'inference optimization'], related: 'FastAPI' },
    { label: 'MLflow or experiment tracking', aliases: ['mlflow', 'experiment tracking'], related: '' },
    { label: 'Kubeflow or Ray', aliases: ['kubeflow', '=Ray'], related: 'Kubernetes' },
    { label: 'Terraform or infrastructure as code', aliases: ['terraform', 'infrastructure as code', 'pulumi', 'ansible', 'cloudformation'], related: 'Docker' },
    { label: 'Spark or Databricks', aliases: ['=Spark', 'pyspark', 'apache spark', 'databricks'], related: '' },
    { label: 'Airflow or dbt', aliases: ['airflow', '=dbt'], related: '' },
    { label: 'Kafka', aliases: ['kafka'], related: '' },
    { label: 'Snowflake or BigQuery', aliases: ['snowflake', 'bigquery', 'redshift'], related: 'PostgreSQL' },
    { label: 'Java', aliases: ['=Java'], related: '' },
    { label: 'Scala', aliases: ['scala'], related: '' },
    { label: 'Go', aliases: ['golang'], related: '' },
    { label: 'Rust', aliases: ['=Rust'], related: '' },
    { label: 'C++', aliases: ['c++'], related: '' },
    { label: 'C# or .NET', aliases: ['c#', '.net'], related: '' },
    { label: 'TensorFlow or Keras', aliases: ['tensorflow', 'keras'], related: 'PyTorch' },
    { label: 'scikit-learn', aliases: ['scikit-learn', 'sklearn', 'scikit learn'], related: 'PyTorch' },
    { label: 'Deep learning', aliases: ['deep learning', 'neural network'], related: 'PyTorch, QLoRA' },
    { label: 'Computer vision', aliases: ['computer vision', 'opencv', 'image classification', 'object detection', 'yolo'], related: '' },
    { label: 'Speech (ASR, TTS)', aliases: ['speech recognition', 'asr', 'text-to-speech', 'tts', 'whisper'], related: '' },
    { label: 'Multimodal models', aliases: ['multimodal', 'multi-modal', 'vision-language'], related: '' },
    { label: 'Reinforcement learning or RLHF', aliases: ['reinforcement learning', 'rlhf', 'dpo'], related: 'QLoRA' },
    { label: 'Recommender systems', aliases: ['recommender', 'recommendation system'], related: '' },
    { label: 'Time series and forecasting', aliases: ['time series', 'forecasting'], related: '' },
    { label: 'A/B testing', aliases: ['a/b testing', 'a/b test', 'ab testing'], related: 'Statistics' },
    { label: 'Responsible AI and EU AI Act', aliases: ['responsible ai', 'ai governance', 'eu ai act', 'ai act', 'fairness'], related: 'Guardrails and human review' },
    { label: 'Frontend frameworks (Vue, Angular, Next.js)', aliases: ['vue', 'angular', 'next.js', 'nextjs'], related: 'React' },
    { label: 'GraphQL', aliases: ['graphql'], related: 'REST APIs' },
    { label: 'Microservices', aliases: ['microservice'], related: 'FastAPI' }
  ];

  var NICE_HEAD = /(nice[- ]to[- ]have|nice to haves|bonus|preferred|desirable|good to have|would be great|plus points|von vorteil|wünschenswert|optional|is a plus|are a plus|a big plus|ideally)/i;
  var MUST_HEAD = /(requirements|must[- ]have|required|what you bring|what we expect|your profile|qualifications|you have|you bring|about you|dein profil|ihr profil|anforderungen|was du mitbringst|was sie mitbringen|responsibilities|what you will do|what you'll do|your tasks|deine aufgaben|ihre aufgaben)/i;

  var ALT = /\bor\b|\boder\b|such as|e\.g\.|z\.\s?b\.|for example|zum beispiel|similar|ähnlich/i;

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'); }
  function aliasRe(a) {
    var cs = a.charAt(0) === '=', t = cs ? a.slice(1) : a;
    var plural = /[a-z]$/i.test(t) ? '(?:s|es)?' : '';
    return new RegExp('(?<![A-Za-z0-9+#])' + esc(t) + plural + '(?![A-Za-z0-9+#])', cs ? 'g' : 'gi');
  }

  function cardText(id) {
    var el = document.getElementById(id);
    return el ? el.textContent.replace(/\s+/g, ' ') : '';
  }
  function cardTitle(id) {
    var el = document.getElementById(id), t = el && el.querySelector('.card-title');
    return t ? t.textContent.trim() : id;
  }

  /* Drop anything the page does not back up */
  var pageText = document.body.textContent.replace(/\s+/g, ' ');
  var dropped = [];
  SHOWN.forEach(function (s) {
    s.proof = s.proof.filter(function (p) {
      var ok = cardText(p.card).indexOf(p.fact) !== -1;
      if (!ok) dropped.push(s.label + ': "' + p.fact + '" not in #' + p.card);
      return ok;
    });
  });
  SHOWN = SHOWN.filter(function (s) { return s.proof.length; });
  LISTED = LISTED.filter(function (s) {
    var ok = pageText.indexOf(s.evidence) !== -1;
    if (!ok) dropped.push(s.label + ': evidence "' + s.evidence + '" not on page');
    return ok;
  });
  if (dropped.length && window.console) console.warn('jdfit: dropped unverifiable entries', dropped);

  /* One flat list of aliases, longest first, so "A/B testing" wins over "testing" */
  var ENTRIES = [];
  [['shown', SHOWN], ['listed', LISTED], ['gap', GAPS]].forEach(function (g) {
    g[1].forEach(function (s, i) {
      s.kind = g[0]; s.key = g[0] + i;
      s.aliases.forEach(function (a) { ENTRIES.push({ s: s, a: a, len: a.replace(/^=/, '').length, re: aliasRe(a) }); });
    });
  });
  ENTRIES.sort(function (x, y) { return y.len - x.len; });

  function clauseHits(text) {
    var hits = [];
    ENTRIES.forEach(function (e) {
      e.re.lastIndex = 0;
      var hit = false;
      text = text.replace(e.re, function (m) { hit = true; return ' '.repeat(m.length); });
      if (hit && hits.indexOf(e.s) === -1) hits.push(e.s);
    });
    return hits;
  }

  function analyse(jd) {
    var lines = jd.split(/\r?\n/), section = 'must', found = {}, levels = [];
    lines.forEach(function (raw, idx) {
      var line = raw.trim();
      levels[idx] = section;
      if (!line) return;
      var short = line.length < 70;
      if (short && NICE_HEAD.test(line) && !MUST_HEAD.test(line)) section = 'nice';
      else if (short && MUST_HEAD.test(line)) section = 'must';
      var level = NICE_HEAD.test(line) ? 'nice' : section;
      levels[idx] = level;
      var work = line;
      ENTRIES.forEach(function (e) {
        e.re.lastIndex = 0;
        var hit = false;
        work = work.replace(e.re, function (m) { hit = true; return ' '.repeat(m.length); });
        if (!hit) return;
        var f = found[e.s.key];
        if (!f) found[e.s.key] = { s: e.s, level: level, terms: [e.a.replace(/^=/, '')] };
        else {
          if (level === 'must') f.level = 'must';
          if (f.terms.indexOf(e.a.replace(/^=/, '')) === -1) f.terms.push(e.a.replace(/^=/, ''));
        }
      });
      /* "Pinecone or pgvector": a gap offered as an alternative to something shown in the same clause */
      line.split(/[,;:]|\band\b|\bund\b|\bwith\b|\bmit\b/i).forEach(function (clause) {
        var here = clauseHits(clause), alt = ALT.test(clause);
        var shownHere = here.filter(function (x) { return x.kind === 'shown'; }).map(function (x) { return x.label; });
        here.forEach(function (x) {
          if (x.kind !== 'gap' || !found[x.key]) return;
          var f = found[x.key];
          f.alts = f.alts || [];
          if (alt && shownHere.length) shownHere.forEach(function (l) { if (f.alts.indexOf(l) === -1) f.alts.push(l); });
          else f.strict = true;
        });
      });
    });
    return { items: Object.keys(found).map(function (k) { return found[k]; }), other: otherChecks(jd, lines, levels) };
  }

  /* Language level is read from the words around the language name, so "English C1, German a plus"
     does not count as a C1 German requirement */
  function langMentions(lines, levels, re) {
    var out = [];
    lines.forEach(function (l, i) {
      /* the clause that names the language: split on , ; ( ) and "and"/"und" */
      l.split(/[,;()]|\band\b|\bund\b/i).forEach(function (clause) {
        if (!re.test(clause)) return;
        out.push({ win: clause, nice: levels[i] === 'nice' || NICE_HEAD.test(clause) });
      });
    });
    return out;
  }

  function otherChecks(jd, lines, levels) {
    var out = [];
    var LEVEL = /\b(c2|c1|b2|native|muttersprach[a-zäöü]*|verhandlungssicher[a-zäöü]*|fließend[a-zäöü]*|fluent|business fluent|business)(?![a-z])/i;
    var CTX = /(language|speak|spoken|written|fluent|fluency|proficien|level|native|business|\bc1\b|\bc2\b|\bb1\b|\bb2\b|kenntnisse|sprach|fließend|verhandlungssicher|muttersprach|skills|required|plus|preferred|communication)/i;
    var de = langMentions(lines, levels, /\b(german|deutsch(?:kenntnisse)?)(?![a-z])/i).filter(function (m) { return CTX.test(m.win); });
    if (de.length) {
      var strict = de.filter(function (m) { return LEVEL.test(m.win); });
      var must = strict.filter(function (m) { return !m.nice; });
      var pick = (must[0] || strict[0]);
      if (pick) {
        var raw = pick.win.match(LEVEL)[0].toLowerCase();
        var lvl = /^c[12]$|^b2$/.test(raw) ? raw.toUpperCase() : /^(native|muttersprach)/.test(raw) ? 'native' :
          /^(verhandlungssicher|business)/.test(raw) ? 'business-fluent' : 'fluent';
        out.push({ label: 'German', status: must.length ? 'partial' : 'info',
          text: 'The post asks for ' + lvl + ' German' + (must.length ? '' : ' (nice to have)') + '. Rohith has German B1.' });
      } else {
        out.push({ label: 'German', status: 'ok', text: 'The post mentions German' + (de.every(function (m) { return m.nice; }) ? ' as a nice to have' : '') + '. Rohith has German B1.' });
      }
    }
    var en = langMentions(lines, levels, /\b(english|englisch(?:kenntnisse)?)(?![a-z])/i).filter(function (m) { return CTX.test(m.win); });
    if (en.length) {
      var native = en.some(function (m) { return /\b(c2|native)\b/i.test(m.win); });
      out.push({ label: 'English', status: native ? 'partial' : 'ok', text: native ? 'The post asks for native or C2 English. Rohith has English C1.' : 'The post asks for English. Rohith has English C1.' });
    }
    var yrs = jd.match(/(\d{1,2})\s*\+?\s*(?:(?:-|to|bis)\s*\d{1,2}\s*)?\+?\s*(?:years|yrs|jahre)/i);
    if (yrs) out.push({ label: 'Experience', status: 'info', text: 'The post asks for ' + yrs[0].replace(/\s+/g, ' ') + ' of experience. Rohith: AI Engineer, Independent Projects (April 2026 to Present), after an MSc in Data Science (Mar 2024 to Mar 2026).' });
    var phd = /\b(phd|ph\.d|doctorate)\b/i.test(jd), master = /\b(master|msc|m\.sc|degree|bachelor|studium|abschluss|university)/i.test(jd);
    if (phd && !master) out.push({ label: 'Degree', status: 'gap', text: 'The post asks for a PhD. Rohith has an MSc in Data Science.' });
    else if (phd || master) out.push({ label: 'Degree', status: 'ok', text: 'MSc Data Science, University of Europe for Applied Sciences, Potsdam; B.Tech Computer Science and Engineering, GITAM University.' });
    if (/(work permit|work authori[sz]ation|visa|sponsorship|right to work|arbeitserlaubnis|eligible to work|eu citizen)/i.test(jd))
      out.push({ label: 'Work authorization', status: 'ok', text: 'Job Seeker Visa. No employer sponsorship needed.' });
    return out;
  }

  /* Rendering, with DOM nodes only (the pasted text is never inserted as HTML) */
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function jump(id) {
    var a = h('a', null, cardTitle(id) + ' →');
    a.href = '#' + id;
    a.addEventListener('click', function (ev) {
      var el = document.getElementById(id); if (!el) return;
      ev.preventDefault();
      el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      el.classList.add('in', 'flash'); setTimeout(function () { el.classList.remove('flash'); }, 2000);
    });
    return a;
  }
  function tag(level) { return h('span', 'fit-tag ' + level, level === 'must' ? 'must-have' : 'nice to have'); }
  function order(a, b) { return (a.level === b.level ? 0 : a.level === 'must' ? -1 : 1) || a.s.label.localeCompare(b.s.label); }

  function render(res, out) {
    out.textContent = '';
    var shown = res.items.filter(function (i) { return i.s.kind === 'shown'; }).sort(order);
    var listed = res.items.filter(function (i) { return i.s.kind === 'listed'; }).sort(order);
    var gaps = res.items.filter(function (i) { return i.s.kind === 'gap'; }).sort(order);
    var total = res.items.length;
    var must = res.items.filter(function (i) { return i.level === 'must'; });
    var mustShown = must.filter(function (i) { return i.s.kind === 'shown'; });

    if (!total && !res.other.length) {
      out.appendChild(h('p', 'fit-summary', 'No recognised skills found. Paste the full job post, including the requirements.'));
      return;
    }
    var summary = 'Evidence in projects for ' + shown.length + ' of ' + total + ' recognised skills';
    if (must.length) summary += ' (' + mustShown.length + ' of ' + must.length + ' must-haves)';
    summary += '.';
    if (gaps.length) summary += ' Not shown yet: ' + gaps.map(function (g) { return g.s.label + (g.alts && g.alts.length && !g.strict ? ' (alternative shown)' : ''); }).join(', ') + '.';
    var de = res.other.filter(function (o) { return o.label === 'German' && o.status === 'partial'; })[0];
    if (de) summary += ' ' + de.text;
    out.appendChild(h('p', 'fit-summary', summary));

    function group(title, items, build) {
      if (!items.length) return;
      var sec = h('div', 'fit-group');
      sec.appendChild(h('h4', null, title + ' (' + items.length + ')'));
      var ul = h('ul', 'fit-list');
      items.forEach(function (i) { ul.appendChild(build(i)); });
      sec.appendChild(ul);
      out.appendChild(sec);
    }
    group('Shown in projects', shown, function (i) {
      var li = h('li', 'fit-item ok');
      var head = h('div', 'fit-head'); head.appendChild(h('strong', null, i.s.label)); head.appendChild(tag(i.level));
      li.appendChild(head);
      var proofs = h('div', 'fit-proof');
      i.s.proof.forEach(function (p) { var r = h('span', 'fit-p'); r.appendChild(jump(p.card)); r.appendChild(h('span', 'fit-fact', p.say || p.fact)); proofs.appendChild(r); });
      li.appendChild(proofs);
      return li;
    });
    group('Listed in skills, no project proof yet', listed, function (i) {
      var li = h('li', 'fit-item listed');
      var head = h('div', 'fit-head'); head.appendChild(h('strong', null, i.s.label)); head.appendChild(tag(i.level));
      li.appendChild(head);
      li.appendChild(h('div', 'fit-note', 'On the page under skills or background, not demonstrated in a project card.'));
      return li;
    });
    group('Not shown in projects yet', gaps, function (i) {
      var li = h('li', 'fit-item gap');
      var head = h('div', 'fit-head'); head.appendChild(h('strong', null, i.s.label)); head.appendChild(tag(i.level));
      li.appendChild(head);
      var note = 'Not shown in projects yet.';
      if (i.alts && i.alts.length && !i.strict) note += ' The post offers an alternative that is shown: ' + i.alts.join(', ') + '.';
      else if (i.s.related) note += ' Related on this page: ' + i.s.related + '.';
      li.appendChild(h('div', 'fit-note', note));
      return li;
    });
    if (res.other.length) {
      var sec = h('div', 'fit-group');
      sec.appendChild(h('h4', null, 'Other requirements'));
      var ul = h('ul', 'fit-list');
      res.other.forEach(function (o) {
        var li = h('li', 'fit-item ' + (o.status === 'ok' ? 'ok' : o.status === 'info' ? 'info' : 'gap'));
        var head = h('div', 'fit-head'); head.appendChild(h('strong', null, o.label)); li.appendChild(head);
        li.appendChild(h('div', 'fit-note', o.text));
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      out.appendChild(sec);
    }
    out.appendChild(h('p', 'fit-foot', 'Only the ' + (SHOWN.length + LISTED.length + GAPS.length) + ' skill groups in this checker are recognised; other terms in the post are not counted. Must-have or nice-to-have is read from headings such as "Nice to have" or "von Vorteil". The text never leaves your browser.'));
  }

  window.JDFIT = { analyse: analyse, render: render, dropped: dropped, counts: { shown: SHOWN.length, listed: LISTED.length, gaps: GAPS.length } };
})();
