function semilogx(varargin)
  % Syntax
  % semilogx(Y)
  % semilogx(X1,Y1,...)
  % semilogx(X1,Y1,LineSpec,...)
  % semilogx(...,'PropertyName',PropertyValue,...)
  % h = semilogx(...)
  % 
  % Description
  % 
  % semilogx plot data as logarithmic scales for the x-axis.
  % 
  % semilogx(Y) creates a plot using a base 10 logarithmic scale for the x-axis and a linear scale for the y-axis. It plots the columns of Y versus their index if Y contains real numbers. semilogx(Y) is equivalent to semilogx(real(Y), imag(Y)) if Y contains complex numbers. semilogx ignores the imaginary component in all other uses of this function.
  % 
  % semilogx(X1,Y1,...) plots all Xn versus Yn pairs. If only Xn or Yn is a matrix, semilogx plots the vector argument versus the rows or columns of the matrix, along the dimension of the matrix whose length matches the length of the vector. If the matrix is square, its columns plot against the vector if their lengths match.
  % 
  % semilogx(X1,Y1,LineSpec,...) plots all lines defined by the Xn,Yn,LineSpec triples. LineSpec determines line style, marker symbol, and color of the plotted lines.
  % 
  % semilogx(...,'PropertyName',PropertyValue,...) sets property values for all lineseries properties graphics objects created by semilogx.
  % 
  % h = semilogx(...) return a vector of handles to lineseries graphics objects, one handle per line.
   
  plot(varargin{:}, 'logx', 'true');
end
