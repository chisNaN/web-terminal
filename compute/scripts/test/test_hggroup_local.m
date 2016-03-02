clf;
hold on;
hg = hggroup();
hg1 = hggroup('Parent', hg);
hg2 = hggroup('Parent', hg);
plot(randn(10,10));
line([4,5,6,5.5,4.5],[-1,1,-1,0,0],'Parent',hg1, 'LineWidth', 10);
line([1,2,2,2,3],[1,0,-1,0,1],'Parent',hg2, 'LineWidth', 10);
line([7,8,8,8,9],[1,0,-1,0,1],'Parent',hg2, 'LineWidth', 10);
