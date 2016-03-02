function semilogx(varargin)
  %Syntax
  %loglog(Y)
  %loglog(X1,Y1,...)
  %loglog(X1,Y1,LineSpec,...)
  %loglog(...,'PropertyName',PropertyValue,...)
  %h = loglog(...)
  %
  %Description
  %
  %loglog(Y) plots the columns of Y versus their index if Y contains real numbers. If Y contains complex numbers, loglog(Y) and loglog(real(Y),imag(Y)) are equivalent. loglog ignores the imaginary component in all other uses of this function.
  %
  %loglog(X1,Y1,...) plots all Xn versus Yn pairs. If only Xn or Yn is a matrix, loglog plots the vector argument versus the rows or columns of the matrix, along the dimension of the matrix whose length matches the length of the vector. If the matrix is square, its columns plot against the vector if their lengths match.
  %
  %loglog(X1,Y1,LineSpec,...) plots all lines defined by the Xn,Yn,LineSpec triples, where LineSpec determines line type, marker symbol, and color of the plotted lines. You can mix Xn,Yn,LineSpec triples with Xn,Yn pairs, for example,
  %
  %loglog(X1,Y1,X2,Y2,LineSpec,X3,Y3)
  %loglog(...,'PropertyName',PropertyValue,...) sets property values for all lineseries properties graphics objects created by loglog.
  %
  %h = loglog(...) returns a column vector of handles to lineseries graphics objects, one handle per line.
  %
  %If you do not specify a color when plotting more than one line, loglog automatically cycles through the colors and line styles in the order specified by the current axes.
  %
  %If you attempt to add a loglog, semilogx, or semilogy plot to a linear axis mode graph with hold on, the axis mode remains as it is and the new data plots as linear.

  plot(varargin{:}, 'logx', 'true', 'logy', 'true');
end
