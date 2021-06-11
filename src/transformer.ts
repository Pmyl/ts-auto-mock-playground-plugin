import { TsAutoMockOptions } from 'ts-auto-mock/options/options';
import tsAutoMockTransformer from 'ts-auto-mock/transformer';
import * as ts from 'typescript';

export function transformerWrapperFix(program: ts.Program, options?: Partial<TsAutoMockOptions>): ts.TransformerFactory<ts.SourceFile> {
  const factory: ts.TransformerFactory<ts.SourceFile> = tsAutoMockTransformer(program, options as TsAutoMockOptions);

  return (context: ts.TransformationContext): ((file: ts.SourceFile) => ts.SourceFile) => {
    const transformer: ts.Transformer<ts.SourceFile> = factory(context);

    return (file: ts.SourceFile): ts.SourceFile => {
      fixNodeAndChildren(file, context);
      return transformer(file);
    };
  }
}

function fixNode(node: ts.Node): ts.Node {
  const originalNode: ts.Node = (node as any).original;

  if (!!originalNode) {
    node.getSourceFile = (() => ({ fileName: '/input.tsx' })) as any;
    (node as any).typeArguments = (originalNode as any).typeArguments;
  }

  return node;
}

function fixNodeAndChildren(node: ts.Node, context: ts.TransformationContext): ts.VisitResult<ts.Node> {
  return ts.visitEachChild(fixNode(node), (childNode: ts.Node) => fixNodeAndChildren(childNode, context), context);
}
