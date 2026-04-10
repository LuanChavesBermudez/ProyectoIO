// Contruye el arbol de prioridad
export function buildTree(P, i, j) {
  if (i === j) return { label: String.fromCharCode(65 + i), leaf: true }
  const k = Math.round(P[i][j]) - 1
  return {
    label: "×",
    leaf: false,
    left:  buildTree(P, i, k),
    right: buildTree(P, k + 1, j),
  }
}

// 
let _leafCounter = 0

function _assignPositions(node, depth) {
  node.depth = depth
  if (node.leaf) {
    node.x = _leafCounter++
    return
  }
  _assignPositions(node.left,  depth + 1)
  _assignPositions(node.right, depth + 1)
  node.x = (node.left.x + node.right.x) / 2
}

export function assignPositions(root) {
  _leafCounter = 0
  _assignPositions(root, 0)
}

export function collectAll(node, nodes = [], edges = []) {
  nodes.push(node)
  if (!node.leaf) {
    edges.push({ from: node, to: node.left })
    edges.push({ from: node, to: node.right })
    collectAll(node.left,  nodes, edges)
    collectAll(node.right, nodes, edges)
  }
  return { nodes, edges }
}

export function getTreeDepth(node) {
  if (node.leaf) return 0
  return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right))
}
