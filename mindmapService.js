const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

class MindmapService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.outputDir = path.join(__dirname, '../downloads');
    this.ensureOutputDir();
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create output directory:', error);
    }
  }

  async generateMindmap(content, options = {}) {
    try {
      const { format = 'json', style = 'tree' } = options;
      
      // First, get the mindmap data structure
      const mindmapData = await this.generateMindmapData(content);
      
      // Generate visual representation
      let result;
      switch (format.toLowerCase()) {
        case 'json':
          result = await this.generateJSONMindmap(mindmapData);
          break;
        case 'html':
          result = await this.generateInteractiveMindmap(content, options);
          break;
        default:
          result = await this.generateJSONMindmap(mindmapData);
      }
      
      return result;
    } catch (error) {
      console.error('Mindmap generation error:', error);
      throw new Error('Failed to generate mindmap');
    }
  }

  async generateMindmapData(content) {
    try {
      const text = this.extractText(content);
      
      const prompt = `Create a comprehensive mindmap structure from the following content.
      Organize information hierarchically with a central topic and multiple levels of branches.
      
      Content: ${text}
      
      Create a mindmap with:
      1. A central topic
      2. 3-6 main branches (primary topics)
      3. 2-4 sub-branches for each main branch
      4. Additional detail nodes where appropriate
      
      Format as JSON:
      {
        "title": "Central Topic",
        "id": "root",
        "children": [
          {
            "id": "branch1",
            "title": "Main Branch 1",
            "level": 1,
            "color": "#FF6B6B",
            "children": [
              {
                "id": "sub1-1",
                "title": "Sub-branch 1.1",
                "level": 2,
                "color": "#FFE66D",
                "children": []
              }
            ]
          }
        ],
        "connections": [
          {"from": "root", "to": "branch1"},
          {"from": "branch1", "to": "sub1-1"}
        ],
        "metadata": {
          "totalNodes": 10,
          "maxDepth": 3,
          "topics": ["topic1", "topic2"]
        }
      }`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 2500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Mindmap data generation error:', error);
      throw new Error('Failed to generate mindmap data');
    }
  }

  async generateJSONMindmap(mindmapData) {
    try {
      const filename = `mindmap-${uuidv4()}.json`;
      const filepath = path.join(this.outputDir, filename);
      await fs.writeFile(filepath, JSON.stringify(mindmapData, null, 2), 'utf8');
      return {
        type: 'mindmap',
        format: 'json',
        filename: filename,
        filepath: filepath,
        downloadUrl: `/api/download/mindmap/${filename}`,
        data: mindmapData,
        metadata: {
          nodeCount: this.countNodes(mindmapData),
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('JSON mindmap generation error:', error);
      throw new Error('Failed to generate JSON mindmap');
    }
  }

  async generateInteractiveMindmap(content, options = {}) {
    try {
      const mindmapData = await this.generateMindmapData(content);
      
      // Generate HTML with interactive JavaScript
      const html = this.generateInteractiveHTML(mindmapData, options);
      
      const filename = `interactive-mindmap-${uuidv4()}.html`;
      const filepath = path.join(this.outputDir, filename);
      
      await fs.writeFile(filepath, html);
      
      return {
        type: 'interactive-mindmap',
        format: 'html',
        filename: filename,
        filepath: filepath,
        downloadUrl: `/api/download/mindmap/${filename}`,
        viewUrl: `/api/mindmap/view/${filename}`,
        data: mindmapData
      };
    } catch (error) {
      console.error('Interactive mindmap generation error:', error);
      throw new Error('Failed to generate interactive mindmap');
    }
  }

  generateInteractiveHTML(mindmapData, options = {}) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${mindmapData.title} - Interactive Mindmap</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        
        .mindmap-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }
        
        .node {
            cursor: pointer;
        }
        
        .node rect {
            transition: fill 0.3s;
        }
        
        .node:hover rect {
            fill: #0056b3;
        }
        
        .node text {
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="mindmap-container">
        <h1>${mindmapData.title}</h1>
        <svg id="mindmap-svg" width="100%" height="600px"></svg>
    </div>
    
    <script>
        const mindmapData = ${JSON.stringify(mindmapData)};
        
        const svg = d3.select("#mindmap-svg");
        const width = 800;
        const height = 600;
        
        const g = svg.append("g")
          .attr("transform", "translate(40,0)");
        
        const tree = d3.tree()
          .size([height, width - 160]);
        
        const root = d3.hierarchy(mindmapData);
        
        tree(root);
        
        // Links
        g.selectAll(".link")
          .data(root.links())
          .enter().append("path")
          .attr("class", "link")
          .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)
          )
          .style("fill", "none")
          .style("stroke", "#6c757d")
          .style("stroke-width", "2px");
        
        // Nodes
        const node = g.selectAll(".node")
          .data(root.descendants())
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", d => "translate(" + d.y + "," + d.x + ")");
        
        node.append("circle")
          .attr("r", 10)
          .style("fill", "#007bff");
        
        node.append("text")
          .attr("dy", 3)
          .attr("x", d => d.children ? -8 : 8)
          .style("text-anchor", d => d.children ? "end" : "start")
          .text(d => d.data.title);
    </script>
</body>
</html>
`;
  }

  countNodes(node) {
    let count = 1;
    if (node.children) {
      node.children.forEach(child => {
        count += this.countNodes(child);
      });
    }
    return count;
  }

  extractText(content) {
    // Handle both string and object input, and undefined/null
    if (!content) {
      return '';
    } else if (typeof content === 'string') {
      return content.replace(/<\/?[^>]+(>|$)/g, '').trim();
    } else if (typeof content.text === 'string') {
      return content.text.replace(/<\/?[^>]+(>|$)/g, '').trim();
    } else {
      return JSON.stringify(content);
    }
  }
}

module.exports = new MindmapService();